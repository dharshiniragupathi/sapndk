const pool = require('../config/db');

const LATEST_EXAMS_CTE = `
  WITH canonical_exams AS (
    SELECT
      e.id,
      e.exam_name,
      e.max_marks,
      e.exam_date,
      CASE
        WHEN REPLACE(LOWER(REGEXP_REPLACE(e.exam_name, '^(MBBS|MD)\\s+', '', 'i')), ' ', '') = 'internal1' THEN 'internal1'
        WHEN REPLACE(LOWER(REGEXP_REPLACE(e.exam_name, '^(MBBS|MD)\\s+', '', 'i')), ' ', '') = 'internal2' THEN 'internal2'
        WHEN REPLACE(LOWER(REGEXP_REPLACE(e.exam_name, '^(MBBS|MD)\\s+', '', 'i')), ' ', '') = 'midterm' THEN 'midterm'
        WHEN REPLACE(LOWER(REGEXP_REPLACE(e.exam_name, '^(MBBS|MD)\\s+', '', 'i')), ' ', '') IN ('final', 'finalexam') THEN 'finalexam'
        ELSE REPLACE(LOWER(REGEXP_REPLACE(e.exam_name, '^(MBBS|MD)\\s+', '', 'i')), ' ', '')
      END AS exam_key
    FROM exams e
  ),
  latest_exams AS (
    SELECT DISTINCT ON (exam_key)
      id,
      exam_name,
      max_marks,
      exam_date,
      exam_key
    FROM canonical_exams
    ORDER BY exam_key, id DESC
  )
`;

const getStudentIdByUser = async (userId) => {
  const result = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
  return result.rows[0]?.id || null;
};

const CLASS_SCORE_WEIGHTS = { internal1: 0.2, internal2: 0.2, midterm: 0.25, finalexam: 0.35 };

const normalizeExamKey = (examName) =>
  String(examName || '')
    .trim()
    .replace(/^(MBBS|MD)\s+/i, '')
    .toLowerCase()
    .replace(/\s+/g, '');

const normalizeRequestedExamName = (examName) =>
  String(examName || '')
    .trim()
    .replace(/^(MBBS|MD)\s+/i, '')
    .replace(/^mid\s*term$/i, 'Midterm')
    .replace(/^final$/i, 'Final Exam')
    .trim();

const buildClassScoreboard = async ({ department, semester, staffId = null, examName = '' }) => {
  const params = [department, semester];
  let staffFilter = '';
  if (Number.isFinite(Number(staffId))) {
    params.push(Number(staffId));
    staffFilter = `AND s.staff_id = $${params.length}`;
  }
  const normalizedExamName = normalizeRequestedExamName(examName);
  let examFilter = '';
  if (normalizedExamName) {
    params.push(normalizedExamName.toLowerCase().replace(/\s+/g, ''));
    examFilter = `AND REPLACE(LOWER(REGEXP_REPLACE(e.exam_name, '^(MBBS|MD)\\s+', '', 'i')), ' ', '') = $${params.length}`;
  }

  const cohortRows = await pool.query(
    `${LATEST_EXAMS_CTE}
     SELECT
       s.id AS student_id,
       u.name AS student_name,
       s.usn,
       sub.subject_name,
       e.exam_name,
       m.marks_obtained
     FROM students s
     JOIN users u ON u.id = s.user_id
     JOIN marks m ON m.student_id = s.id
     JOIN subjects sub ON sub.id = m.subject_id
     JOIN latest_exams e ON e.id = m.exam_id
     WHERE s.department = $1
       AND s.semester = $2
       ${staffFilter}
       ${examFilter}`,
    params
  );

  const groupedScores = cohortRows.rows.reduce((acc, row) => {
    const examKey = normalizeExamKey(row.exam_name);
    const subjectName = String(row.subject_name || '').trim();
    const studentKey = String(row.student_id);
    const marks = Number(row.marks_obtained);
    if (!subjectName || !studentKey || !Number.isFinite(marks)) return acc;
    if (!acc[examKey]) acc[examKey] = {};
    if (!acc[examKey][subjectName]) acc[examKey][subjectName] = [];
    acc[examKey][subjectName].push({
      studentId: studentKey,
      studentName: String(row.student_name || 'Student'),
      usn: String(row.usn || ''),
      marks,
    });
    return acc;
  }, {});

  const examPercentilesByStudent = {};
  Object.entries(groupedScores).forEach(([examKey, subjectMap]) => {
    const subjectPercentilesByStudent = {};

    Object.values(subjectMap).forEach((entries) => {
      const scores = entries.map((entry) => entry.marks).filter(Number.isFinite);
      entries.forEach((entry) => {
        const percentile = scores.length
          ? (scores.filter((score) => score <= entry.marks).length / scores.length) * 100
          : NaN;
        if (!Number.isFinite(percentile)) return;
        if (!subjectPercentilesByStudent[entry.studentId]) {
          subjectPercentilesByStudent[entry.studentId] = {
            student_name: entry.studentName,
            usn: entry.usn,
            scores: [],
          };
        }
        subjectPercentilesByStudent[entry.studentId].scores.push(percentile);
      });
    });

    Object.entries(subjectPercentilesByStudent).forEach(([studentKey, studentEntry]) => {
      const examPercentile = studentEntry.scores.reduce((sum, value) => sum + value, 0) / studentEntry.scores.length;
      if (!examPercentilesByStudent[studentKey]) {
        examPercentilesByStudent[studentKey] = {
          student_id: Number(studentKey),
          student_name: studentEntry.student_name,
          usn: studentEntry.usn,
        };
      }
      examPercentilesByStudent[studentKey][examKey] = examPercentile;
    });
  });

  return Object.values(examPercentilesByStudent)
    .map((studentEntry) => {
      const finalScore = normalizedExamName
        ? Number(studentEntry[normalizeExamKey(normalizedExamName)])
        : Object.entries(CLASS_SCORE_WEIGHTS).reduce((sum, [examKey, weight]) => {
          const score = Number(studentEntry[examKey]);
          return Number.isFinite(score) ? sum + (score * weight) : sum;
        }, 0);
      return {
        student_id: studentEntry.student_id,
        student_name: studentEntry.student_name,
        usn: studentEntry.usn,
        final_score: Number(finalScore.toFixed(2)),
        normalized_score: Number(finalScore.toFixed(2)),
      };
    })
    .sort((left, right) => right.final_score - left.final_score);
};

const ensureStudentQueriesTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS student_queries (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
      query_type TEXT NOT NULL,
      subject TEXT NOT NULL,
      question TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      response TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      responded_at TIMESTAMP
    )`
  );
};

const getMyProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
          u.id AS user_id,
          u.name,
          u.email,
          s.id AS student_id,
          s.usn,
          s.department,
          s.semester,
          s.staff_id,
          COALESCE(st.name, su.name) AS mentor_name,
          COALESCE(st.email, su.email) AS mentor_email,
          CASE
            WHEN s.semester IS NULL OR s.semester <= 0 THEN NULL
            ELSE CONCAT(UPPER(COALESCE(s.department, '')), ' Year ', CEIL(s.semester::numeric / 2)::int)
          END AS degree
       FROM users u
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN staff st ON st.id = s.staff_id
       LEFT JOIN users su ON su.id = st.user_id
       WHERE u.id = $1
       LIMIT 1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch student profile' });
  }
};

const getMyClassTopByExam = async (req, res) => {
  try {
    const meResult = await pool.query(
      'SELECT id, department, semester, staff_id FROM students WHERE user_id = $1 LIMIT 1',
      [req.user.id]
    );
    if (meResult.rows.length === 0) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    const me = meResult.rows[0];
    const examName = String(req.query.exam_name || '').trim();

    const classScoreboard = await buildClassScoreboard({
      department: me.department,
      semester: me.semester,
      staffId: me.staff_id,
      examName,
    });
    if (classScoreboard.length > 0) {
      return res.json(classScoreboard.slice(0, 6));
    }

    const normalizedExamName = normalizeRequestedExamName(examName);
    const params = [me.department, me.semester];
    let examFilter = '';
    if (normalizedExamName) {
      params.push(normalizedExamName.toLowerCase().replace(/\s+/g, ''));
      examFilter = `AND REPLACE(LOWER(REGEXP_REPLACE(e.exam_name, '^(MBBS|MD)\\s+', '', 'i')), ' ', '') = $${params.length}`;
    }

    const result = await pool.query(
      `${LATEST_EXAMS_CTE}
       SELECT
          u.name AS student_name,
          s.usn,
          e.exam_name,
          ROUND(AVG(m.marks_obtained)::numeric, 2) AS marks_obtained,
          MAX(e.max_marks) AS max_marks,
          ROUND(AVG(m.normalized_score)::numeric, 2) AS normalized_score
       FROM students s
       JOIN users u ON u.id = s.user_id
       JOIN marks m ON m.student_id = s.id
       JOIN latest_exams e ON e.id = m.exam_id
       WHERE s.department = $1
         AND s.semester = $2
         ${examFilter}
       GROUP BY s.id, u.name, s.usn, e.exam_name
       ORDER BY normalized_score DESC
       LIMIT 6`,
      params
    );

    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch class top scores' });
  }
};

const getMyPerformance = async (req, res) => {
  try {
    const studentUserId = req.user.id; // from JWT

    const result = await pool.query(
      `
      ${LATEST_EXAMS_CTE}
      SELECT 
        e.exam_name,
        sub.subject_name,
        m.marks_obtained,
        m.normalized_score
      FROM marks m
      JOIN subjects sub ON m.subject_id = sub.id
      JOIN latest_exams e ON m.exam_id = e.id
      JOIN students s ON m.student_id = s.id
      WHERE s.user_id = $1
      `,
      [studentUserId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getMyScores = async (req, res) => {
  try {
    const studentId = await getStudentIdByUser(req.user.id);
    if (!studentId) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const result = await pool.query(
      `${LATEST_EXAMS_CTE}
       SELECT sub.subject_name, e.exam_name, e.exam_date,
              m.marks_obtained, e.max_marks AS exam_max_marks, m.normalized_score
       FROM marks m
       JOIN subjects sub ON sub.id = m.subject_id
       JOIN latest_exams e ON e.id = m.exam_id
       WHERE m.student_id = $1
       ORDER BY e.id, sub.id`,
      [studentId]
    );
    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch subject scores' });
  }
};

const getMyNormalized = async (req, res) => {
  try {
    const studentId = await getStudentIdByUser(req.user.id);
    if (!studentId) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const result = await pool.query(
      `${LATEST_EXAMS_CTE}
       SELECT e.id AS exam_id, e.exam_name,
              ROUND(AVG(m.normalized_score)::numeric, 2) AS normalized_percentage
       FROM marks m
       JOIN latest_exams e ON e.id = m.exam_id
       WHERE m.student_id = $1
       GROUP BY e.id, e.exam_name
       ORDER BY e.id`,
      [studentId]
    );
    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch normalized percentage' });
  }
};

const getMyFinalScore = async (req, res) => {
  try {
    const studentId = await getStudentIdByUser(req.user.id);
    if (!studentId) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const result = await pool.query(
      `${LATEST_EXAMS_CTE}
       SELECT ROUND(AVG(m.normalized_score)::numeric, 2) AS final_normalized_score
       FROM marks m
       JOIN latest_exams e ON e.id = m.exam_id
       WHERE m.student_id = $1`,
      [studentId]
    );
    return res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch final normalized score' });
  }
};

const getMyRank = async (req, res) => {
  try {
    const studentId = await getStudentIdByUser(req.user.id);
    if (!studentId) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const result = await pool.query(
      `${LATEST_EXAMS_CTE}
       , score_board AS (
         SELECT s.id AS student_id, s.department, s.semester,
                AVG(m.normalized_score) AS final_score
         FROM students s
         JOIN marks m ON m.student_id = s.id
         JOIN latest_exams e ON e.id = m.exam_id
         GROUP BY s.id, s.department, s.semester
       ),
       ranked AS (
         SELECT student_id, department, semester, final_score,
                RANK() OVER (PARTITION BY department, semester ORDER BY final_score DESC) AS rank
         FROM score_board
       )
       SELECT student_id, ROUND(final_score::numeric, 2) AS final_score, rank
       FROM ranked
       WHERE student_id = $1`,
      [studentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Rank not available' });
    }
    return res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch rank' });
  }
};

const getMyClassAverage = async (req, res) => {
  try {
    const studentResult = await pool.query(
      'SELECT id, department, semester FROM students WHERE user_id = $1',
      [req.user.id]
    );
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    const student = studentResult.rows[0];

    const result = await pool.query(
      `${LATEST_EXAMS_CTE}
       , student_scores AS (
         SELECT s.id, AVG(m.normalized_score) AS final_score
         FROM students s
         JOIN marks m ON m.student_id = s.id
         JOIN latest_exams e ON e.id = m.exam_id
         WHERE s.department = $1 AND s.semester = $2
         GROUP BY s.id
       )
       SELECT ROUND(AVG(final_score)::numeric, 2) AS class_average
       FROM student_scores`,
      [student.department, student.semester]
    );

    return res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch class average' });
  }
};

const getMyReport = async (req, res) => {
  try {
    const studentId = await getStudentIdByUser(req.user.id);
    if (!studentId) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const [scoreRows, studentMetaRows] = await Promise.all([
      pool.query(
        `SELECT sub.subject_name, e.exam_name, m.marks_obtained, e.max_marks, m.normalized_score
         FROM marks m
         JOIN subjects sub ON sub.id = m.subject_id
         JOIN exams e ON e.id = m.exam_id
         WHERE m.student_id = $1
         ORDER BY e.id, sub.id`,
        [studentId]
      ),
      pool.query(
        'SELECT id, department, semester, staff_id FROM students WHERE id = $1 LIMIT 1',
        [studentId]
      ),
    ]);

    const studentMeta = studentMetaRows.rows[0];

    let finalScore = null;
    let rank = null;
    let classAverage = null;

    const normalizedScoreResult = await pool.query(
      `${LATEST_EXAMS_CTE}
       SELECT ROUND(AVG(m.normalized_score)::numeric, 2) AS final_score
       FROM marks m
       JOIN latest_exams e ON e.id = m.exam_id
       WHERE m.student_id = $1`,
      [studentId]
    );
    finalScore = normalizedScoreResult.rows[0]?.final_score ?? null;

    if (studentMeta?.department && Number.isFinite(Number(studentMeta.semester))) {
      const classScoreboard = await buildClassScoreboard({
        department: studentMeta.department,
        semester: studentMeta.semester,
        staffId: studentMeta.staff_id,
      });
      const myEntry = classScoreboard.find((entry) => entry.student_id === Number(studentId));
      rank = myEntry ? classScoreboard.findIndex((entry) => entry.student_id === myEntry.student_id) + 1 : null;
      classAverage = classScoreboard.length
        ? Number((classScoreboard.reduce((sum, entry) => sum + entry.final_score, 0) / classScoreboard.length).toFixed(2))
        : null;
    }

    return res.json({
      final_score: finalScore,
      rank,
      class_average: classAverage,
      scores: scoreRows.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch student report' });
  }
};

const getMyQueries = async (req, res) => {
  try {
    const studentId = await getStudentIdByUser(req.user.id);
    if (!studentId) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    await ensureStudentQueriesTable();
    const result = await pool.query(
      `SELECT q.id, q.query_type, q.subject, q.question, q.status, q.response, q.created_at,
              COALESCE(st.name, su.name) AS staff_name
       FROM student_queries q
       LEFT JOIN staff st ON st.id = q.staff_id
       LEFT JOIN users su ON su.id = st.user_id
       WHERE q.student_id = $1
       ORDER BY q.created_at DESC`,
      [studentId]
    );
    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch student queries' });
  }
};

const getMyQueryFaculty = async (req, res) => {
  try {
    const studentId = await getStudentIdByUser(req.user.id);
    if (!studentId) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const studentResult = await pool.query(
      'SELECT UPPER(COALESCE(department, \'\')) AS department, semester, staff_id FROM students WHERE id = $1 LIMIT 1',
      [studentId]
    );
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const studentDepartment = String(studentResult.rows[0].department || '').trim();
    const assignedStaffId = Number(studentResult.rows[0].staff_id);
    const semester = Number(studentResult.rows[0].semester);
    const year = Number.isFinite(semester) && semester > 0 ? Math.ceil(semester / 2) : null;
    const fromSemester = Number.isFinite(year) ? (year * 2) - 1 : null;
    const toSemester = Number.isFinite(year) ? year * 2 : null;

    const fetchFacultyRows = async (departmentCode) => {
      const params = [departmentCode];
      let semesterFilter = '';
      if (Number.isFinite(fromSemester) && Number.isFinite(toSemester)) {
        params.push(fromSemester, toSemester);
        semesterFilter = `AND (
          ss.id IS NULL
          OR ss.semester IS NULL
          OR ss.semester BETWEEN $2 AND $3
        )`;
      }

      const result = await pool.query(
        `WITH eligible_staff AS (
           SELECT DISTINCT st.id
           FROM staff st
           LEFT JOIN departments d ON d.id = st.department_id
           WHERE UPPER(COALESCE(d.code, '')) = $1
              OR EXISTS (
                SELECT 1
                FROM students s2
                WHERE s2.staff_id = st.id
                  AND UPPER(COALESCE(s2.department, '')) = $1
              )
         )
         SELECT st.id AS staff_id,
                COALESCE(st.name, u.name) AS staff_name,
                COALESCE(st.email, u.email) AS staff_email,
                UPPER(COALESCE(d.code, $1)) AS department_code,
                COALESCE(
                  array_agg(DISTINCT sub.subject_name) FILTER (WHERE sub.subject_name IS NOT NULL),
                  '{}'
                ) AS subjects
         FROM eligible_staff es
         JOIN staff st ON st.id = es.id
         JOIN users u ON u.id = st.user_id
         LEFT JOIN departments d ON d.id = st.department_id
         LEFT JOIN staff_subjects ss ON ss.staff_id = st.id
         LEFT JOIN subjects sub ON sub.id = ss.subject_id
         WHERE 1 = 1
         ${semesterFilter}
         GROUP BY st.id, st.name, st.email, u.name, u.email, d.code
         ORDER BY staff_name`,
        params
      );
      return result.rows;
    };

    let rows = [];
    if (studentDepartment) {
      rows = await fetchFacultyRows(studentDepartment);
    }

    if (rows.length === 0 && Number.isFinite(assignedStaffId)) {
      const mentorRow = await pool.query(
        `SELECT st.id AS staff_id,
                COALESCE(st.name, u.name) AS staff_name,
                COALESCE(st.email, u.email) AS staff_email,
                UPPER(COALESCE(d.code, $2)) AS department_code,
                COALESCE(
                  array_agg(DISTINCT sub.subject_name) FILTER (WHERE sub.subject_name IS NOT NULL),
                  '{}'
                ) AS subjects
         FROM staff st
         JOIN users u ON u.id = st.user_id
         LEFT JOIN departments d ON d.id = st.department_id
         LEFT JOIN staff_subjects ss ON ss.staff_id = st.id
         LEFT JOIN subjects sub ON sub.id = ss.subject_id
         WHERE st.id = $1
         GROUP BY st.id, st.name, st.email, u.name, u.email, d.code`,
        [assignedStaffId, studentDepartment || '']
      );
      rows = mentorRow.rows;
    }

    if (rows.length === 0) {
      const anyStaff = await pool.query(
        `SELECT st.id AS staff_id,
                COALESCE(st.name, u.name) AS staff_name,
                COALESCE(st.email, u.email) AS staff_email,
                UPPER(COALESCE(d.code, 'N/A')) AS department_code,
                COALESCE(
                  array_agg(DISTINCT sub.subject_name) FILTER (WHERE sub.subject_name IS NOT NULL),
                  '{}'
                ) AS subjects
         FROM staff st
         JOIN users u ON u.id = st.user_id
         LEFT JOIN departments d ON d.id = st.department_id
         LEFT JOIN staff_subjects ss ON ss.staff_id = st.id
         LEFT JOIN subjects sub ON sub.id = ss.subject_id
         GROUP BY st.id, st.name, st.email, u.name, u.email, d.code
         ORDER BY staff_name`
      );
      rows = anyStaff.rows;
    }

    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch faculty list' });
  }
};

const createMyQuery = async (req, res) => {
  try {
    const studentId = await getStudentIdByUser(req.user.id);
    if (!studentId) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const queryType = String(req.body?.query_type || '').trim().toLowerCase();
    const staffId = Number(req.body?.staff_id);
    const subject = String(req.body?.subject || '').trim();
    const question = String(req.body?.question || '').trim();
    if (!queryType || !Number.isFinite(staffId) || !question) {
      return res.status(400).json({ message: 'query_type, staff_id and question are required' });
    }

    const student = await pool.query(
      'SELECT UPPER(COALESCE(department, \'\')) AS department FROM students WHERE id = $1 LIMIT 1',
      [studentId]
    );
    const studentDepartment = String(student.rows[0]?.department || '').trim();
    if (!studentDepartment) {
      return res.status(400).json({ message: 'Student department is not set' });
    }

    const staff = await pool.query(
      `SELECT st.id
       FROM staff st
       LEFT JOIN departments d ON d.id = st.department_id
       WHERE st.id = $1
         AND (
           UPPER(COALESCE(d.code, '')) = $2
           OR EXISTS (
             SELECT 1
             FROM students s2
             WHERE s2.staff_id = st.id
               AND UPPER(COALESCE(s2.department, '')) = $2
           )
         )
       LIMIT 1`,
      [staffId, studentDepartment]
    );
    if (staff.rows.length === 0) {
      return res.status(400).json({ message: 'Please select a valid faculty from your department' });
    }

    await ensureStudentQueriesTable();
    const finalSubject = subject || 'General Query';
    const result = await pool.query(
      `INSERT INTO student_queries (student_id, staff_id, query_type, subject, question, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [studentId, staffId, queryType, finalSubject, question]
    );
    const responseRow = await pool.query(
      `SELECT q.*, COALESCE(st.name, su.name) AS staff_name
       FROM student_queries q
       LEFT JOIN staff st ON st.id = q.staff_id
       LEFT JOIN users su ON su.id = st.user_id
       WHERE q.id = $1
       LIMIT 1`,
      [result.rows[0].id]
    );
    return res.status(201).json(responseRow.rows[0] || result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to submit query' });
  }
};

module.exports = {
  getMyProfile,
  getMyClassTopByExam,
  getMyPerformance,
  getMyScores,
  getMyNormalized,
  getMyFinalScore,
  getMyRank,
  getMyClassAverage,
  getMyReport,
  getMyQueries,
  getMyQueryFaculty,
  createMyQuery,
};

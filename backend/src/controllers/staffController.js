const pool = require('../config/db');
const normalizeScore = require('../utils/normalize');

const getStaffIdByUser = async (userId) => {
  const result = await pool.query('SELECT id FROM staff WHERE user_id = $1', [userId]);
  return result.rows[0]?.id || null;
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

const yearFromSemester = (semester) => {
  const sem = Number(semester);
  if (!Number.isFinite(sem) || sem <= 0) return null;
  return Math.ceil(sem / 2);
};

const yearFromSubjectName = (subjectName) => {
  const name = String(subjectName || '').trim().toLowerCase();
  if (!name) return null;
  if (['anatomy', 'physiology', 'biochemistry'].includes(name)) return 1;
  if (['pathology', 'pharmacology', 'microbiology'].includes(name)) return 2;
  if (['general medicine', 'general surgery', 'obg', 'community medicine'].includes(name)) return 3;
  return null;
};

const getMyProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT st.id AS staff_id,
              st.user_id,
              COALESCE(st.name, u.name) AS name,
              COALESCE(st.email, u.email) AS email,
              d.code AS department
       FROM staff st
       JOIN users u ON u.id = st.user_id
       LEFT JOIN departments d ON d.id = st.department_id
       WHERE st.user_id = $1
       LIMIT 1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch staff profile' });
  }
};

const getMySubjects = async (req, res) => {
  try {
    const staffId = await getStaffIdByUser(req.user.id);
    if (!staffId) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    const result = await pool.query(
      `SELECT ss.id AS assignment_id, ss.staff_id, ss.subject_id, ss.semester, ss.academic_year,
              sub.subject_name, sub.max_marks
       FROM staff_subjects ss
       JOIN subjects sub ON sub.id = ss.subject_id
       WHERE ss.staff_id = $1
       ORDER BY sub.subject_name`,
      [staffId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch assigned subjects' });
  }
};

const getMyStudents = async (req, res) => {
  try {
    const staffId = await getStaffIdByUser(req.user.id);
    if (!staffId) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    const result = await pool.query(
      `SELECT s.id, s.user_id, s.usn, s.department, s.semester, s.staff_id,
              CASE
                WHEN s.semester IS NULL OR s.semester <= 0 THEN NULL
                ELSE CONCAT('Year ', CEIL(s.semester::numeric / 2)::int)
              END AS year_label,
              u.name, u.email
       FROM students s
       JOIN users u ON u.id = s.user_id
       WHERE s.staff_id = $1
       ORDER BY s.id`,
      [staffId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch assigned students' });
  }
};

const getMyStudentMarks = async (req, res) => {
  try {
    const staffId = await getStaffIdByUser(req.user.id);
    if (!staffId) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    const result = await pool.query(
      `SELECT m.id, m.student_id, m.subject_id, m.exam_id,
              m.marks_obtained, m.normalized_score,
              s.usn, s.department, s.semester,
              CASE
                WHEN s.semester IS NULL OR s.semester <= 0 THEN NULL
                ELSE CONCAT('Year ', CEIL(s.semester::numeric / 2)::int)
              END AS year_label,
              sub.subject_name, e.exam_name
       FROM marks m
       JOIN students s ON s.id = m.student_id
       JOIN subjects sub ON sub.id = m.subject_id
       JOIN exams e ON e.id = m.exam_id
       WHERE s.staff_id = $1
       ORDER BY s.id, sub.subject_name, e.id`,
      [staffId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch assigned student marks' });
  }
};

const parseYearToSemesters = (yearValue) => {
  const yearNum = Number(String(yearValue || '').replace(/[^\d]/g, ''));
  if (!Number.isFinite(yearNum) || yearNum <= 0) return null;
  return { from: (yearNum * 2) - 1, to: yearNum * 2 };
};

const getYearStaffContacts = async (req, res) => {
  try {
    const staffId = await getStaffIdByUser(req.user.id);
    if (!staffId) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    const yearFilter = req.query.year;
    const semesters = parseYearToSemesters(yearFilter);
    if (!semesters) {
      return res.status(400).json({ message: 'Valid year is required (e.g., Year 2)' });
    }

    const myDeptResult = await pool.query(
      `SELECT UPPER(COALESCE(d.code, '')) AS department_code
       FROM staff st
       LEFT JOIN departments d ON d.id = st.department_id
       WHERE st.id = $1`,
      [staffId]
    );
    const myDepartmentCode = String(myDeptResult.rows[0]?.department_code || '').trim();
    if (!myDepartmentCode) {
      return res.json([]);
    }

    const contacts = await pool.query(
      `SELECT DISTINCT
              st.id AS staff_id,
              COALESCE(st.name, u.name) AS staff_name,
              COALESCE(st.email, u.email) AS staff_email,
              COUNT(s.id) OVER (PARTITION BY st.id) AS assigned_students
       FROM students s
       JOIN staff st ON st.id = s.staff_id
       JOIN users u ON u.id = st.user_id
       LEFT JOIN departments d ON d.id = st.department_id
       WHERE UPPER(COALESCE(s.department, '')) = $1
         AND UPPER(COALESCE(d.code, '')) = $1
         AND s.semester BETWEEN $2 AND $3
       ORDER BY staff_name`,
      [myDepartmentCode, semesters.from, semesters.to]
    );

    return res.json(contacts.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch staff contacts for selected year' });
  }
};

const createMark = async (req, res) => {
  const { student_id, subject_id, exam_id, marks_obtained } = req.body;
  if (!student_id || !subject_id || !exam_id || marks_obtained === undefined) {
    return res.status(400).json({ message: 'student_id, subject_id, exam_id and marks_obtained are required' });
  }

  const client = await pool.connect();
  try {
    const staffId = await getStaffIdByUser(req.user.id);
    if (!staffId) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    await client.query('BEGIN');

    const studentCheck = await client.query(
      'SELECT id, semester, department FROM students WHERE id = $1 AND staff_id = $2',
      [student_id, staffId]
    );
    if (studentCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Student is not assigned to this staff' });
    }
    const studentRow = studentCheck.rows[0];

    const subjectCheck = await client.query(
      `SELECT sub.id, sub.subject_name
       FROM subjects sub
       JOIN staff_subjects ss ON ss.subject_id = sub.id
       WHERE ss.staff_id = $1
         AND sub.id = $2
       LIMIT 1`,
      [staffId, subject_id]
    );
    if (subjectCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Subject is not assigned to this staff' });
    }
    const subjectRow = subjectCheck.rows[0];

    const studentDept = String(studentRow.department || '').trim().toUpperCase();
    if (studentDept === 'MBBS') {
      const studentYear = yearFromSemester(studentRow.semester);
      const subjectYear = yearFromSubjectName(subjectRow.subject_name);
      if (Number.isFinite(studentYear) && Number.isFinite(subjectYear) && studentYear !== subjectYear) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Subject code year does not match student year' });
      }
    }

    const examResult = await client.query('SELECT max_marks FROM exams WHERE id = $1', [exam_id]);
    if (examResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Invalid exam selected' });
    }

    const maxMarks = Number(examResult.rows[0].max_marks);
    const parsedMarks = Number(marks_obtained);
    if (!Number.isFinite(parsedMarks) || parsedMarks < 0 || parsedMarks > maxMarks) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `marks_obtained must be between 0 and ${maxMarks}` });
    }

    const normalizedScore = normalizeScore(parsedMarks, maxMarks);

    const result = await client.query(
      `INSERT INTO marks (student_id, subject_id, exam_id, marks_obtained, normalized_score, entered_by_staff_id, updated_by_staff_id)
       VALUES ($1, $2, $3, $4, $5, $6, $6)
       RETURNING *`,
      [student_id, subject_id, exam_id, parsedMarks, normalizedScore, staffId]
    );

    await client.query('COMMIT');
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Marks already entered for this exam/subject/student' });
    }
    return res.status(500).json({ message: 'Failed to add marks' });
  } finally {
    client.release();
  }
};

const updateMark = async (req, res) => {
  const { id } = req.params;
  const { marks_obtained } = req.body;
  if (marks_obtained === undefined) {
    return res.status(400).json({ message: 'marks_obtained is required' });
  }

  const client = await pool.connect();
  try {
    const staffId = await getStaffIdByUser(req.user.id);
    if (!staffId) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    await client.query('BEGIN');

    const markResult = await client.query(
      `SELECT m.id, m.exam_id, m.student_id
       FROM marks m
       JOIN students s ON s.id = m.student_id
       WHERE m.id = $1 AND s.staff_id = $2`,
      [id, staffId]
    );

    if (markResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Mark not found for assigned student' });
    }

    const examResult = await client.query('SELECT max_marks FROM exams WHERE id = $1', [markResult.rows[0].exam_id]);
    const maxMarks = Number(examResult.rows[0].max_marks);
    const parsedMarks = Number(marks_obtained);
    if (!Number.isFinite(parsedMarks) || parsedMarks < 0 || parsedMarks > maxMarks) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `marks_obtained must be between 0 and ${maxMarks}` });
    }
    const normalizedScore = normalizeScore(parsedMarks, maxMarks);

    const updated = await client.query(
      `UPDATE marks
       SET marks_obtained = $1,
           normalized_score = $2,
           updated_at = CURRENT_TIMESTAMP,
           updated_by_staff_id = $3
       WHERE id = $4
       RETURNING *`,
      [parsedMarks, normalizedScore, staffId, id]
    );

    await client.query('COMMIT');
    return res.json(updated.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: 'Failed to update marks' });
  } finally {
    client.release();
  }
};

const getSubjectPerformance = async (req, res) => {
  const { subjectId } = req.params;
  try {
    const staffId = await getStaffIdByUser(req.user.id);
    if (!staffId) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    const result = await pool.query(
      `SELECT e.id AS exam_id, e.exam_name,
              ROUND(AVG(m.marks_obtained)::numeric, 2) AS avg_marks,
              ROUND(AVG(m.normalized_score)::numeric, 2) AS avg_normalized,
              MIN(m.marks_obtained) AS min_marks,
              MAX(m.marks_obtained) AS max_marks,
              COUNT(*) AS entries
       FROM marks m
       JOIN exams e ON e.id = m.exam_id
       JOIN students s ON s.id = m.student_id
       WHERE m.subject_id = $1
         AND s.staff_id = $2
       GROUP BY e.id, e.exam_name
       ORDER BY e.id`,
      [subjectId, staffId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch subject performance' });
  }
};

const getSubjectReport = async (req, res) => {
  const { subjectId } = req.params;
  try {
    const staffId = await getStaffIdByUser(req.user.id);
    if (!staffId) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }

    const result = await pool.query(
      `SELECT u.name AS student_name, s.usn, e.exam_name,
              m.marks_obtained, m.normalized_score
       FROM marks m
       JOIN students s ON s.id = m.student_id
       JOIN users u ON u.id = s.user_id
       JOIN exams e ON e.id = m.exam_id
       WHERE m.subject_id = $1
         AND s.staff_id = $2
       ORDER BY u.name, e.id`,
      [subjectId, staffId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch subject report' });
  }
};

const getMyQueries = async (req, res) => {
  try {
    const staffId = await getStaffIdByUser(req.user.id);
    if (!staffId) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }
    await ensureStudentQueriesTable();
    const result = await pool.query(
      `SELECT q.id, q.query_type, q.subject, q.question, q.status, q.response, q.created_at, q.responded_at,
              u.name AS student_name, s.usn AS student_roll
       FROM student_queries q
       JOIN students s ON s.id = q.student_id
       JOIN users u ON u.id = s.user_id
       WHERE q.staff_id = $1
       ORDER BY q.created_at DESC`,
      [staffId]
    );
    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch queries' });
  }
};

const replyToQuery = async (req, res) => {
  try {
    const staffId = await getStaffIdByUser(req.user.id);
    if (!staffId) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }
    const queryId = Number(req.params.id);
    const responseText = String(req.body?.response || '').trim();
    if (!Number.isFinite(queryId) || !responseText) {
      return res.status(400).json({ message: 'Valid query id and response are required' });
    }
    await ensureStudentQueriesTable();
    const updated = await pool.query(
      `UPDATE student_queries
       SET response = $1, status = 'answered', responded_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND staff_id = $3
       RETURNING *`,
      [responseText, queryId, staffId]
    );
    if (updated.rows.length === 0) {
      return res.status(404).json({ message: 'Query not found for this staff' });
    }
    return res.json(updated.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to reply query' });
  }
};

module.exports = {
  getMyProfile,
  getMySubjects,
  getMyStudents,
  getMyStudentMarks,
  getMyQueries,
  replyToQuery,
  getYearStaffContacts,
  createMark,
  updateMark,
  getSubjectPerformance,
  getSubjectReport,
};

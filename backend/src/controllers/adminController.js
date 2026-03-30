const pool = require('../config/db');
const normalizeScore = require('../utils/normalize');

const parseIntOrNull = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const normalizeRole = (role) => (role || '').toLowerCase();
const normalizeDepartmentCode = (value) => String(value || '').trim().toUpperCase();

const resolveDepartmentId = async (client, department) => {
  if (department === undefined || department === null || department === '') return null;

  const numericId = Number(department);
  if (Number.isInteger(numericId) && numericId > 0) return numericId;

  const code = normalizeDepartmentCode(department);
  if (!code) return null;

  const result = await client.query('SELECT id FROM departments WHERE UPPER(code) = $1 LIMIT 1', [code]);
  return result.rows[0]?.id || null;
};

const yearFromSemester = (semester) => {
  const sem = Number(semester);
  if (!Number.isFinite(sem) || sem <= 0) return null;
  return Math.ceil(sem / 2);
};

const pickDominantYear = (yearCountMap) => {
  const entries = Object.entries(yearCountMap || {}).filter(([year, count]) => Number(year) > 0 && Number(count) > 0);
  if (entries.length === 0) return null;

  const [selectedYear] = entries.sort((a, b) => {
    const byCount = Number(b[1]) - Number(a[1]);
    if (byCount !== 0) return byCount;
    return Number(a[0]) - Number(b[0]);
  })[0];
  return Number(selectedYear);
};

const chooseLeastLoadedStaff = (candidateIds, loadByStaffId) => {
  if (!Array.isArray(candidateIds) || candidateIds.length === 0) return null;
  const sorted = [...candidateIds].sort((a, b) => Number(a) - Number(b));
  let selected = sorted[0];
  let minLoad = Number(loadByStaffId[selected] || 0);

  sorted.forEach((staffId) => {
    const currentLoad = Number(loadByStaffId[staffId] || 0);
    if (currentLoad < minLoad) {
      selected = staffId;
      minLoad = currentLoad;
    }
  });
  return selected;
};

const runAutoAssignment = async (client) => {
  const staffRows = await client.query(
    `SELECT st.id AS staff_id,
            UPPER(COALESCE(d.code, '')) AS department_code,
            ss.semester
     FROM staff st
     LEFT JOIN departments d ON d.id = st.department_id
     LEFT JOIN staff_subjects ss ON ss.staff_id = st.id
     ORDER BY st.id`
  );

  const studentsRows = await client.query(
    `SELECT id, usn, UPPER(COALESCE(department, '')) AS department_code, semester, staff_id
     FROM students
     ORDER BY id`
  );

  const staffByDepartment = {};
  const yearsByStaffId = {};

  staffRows.rows.forEach((row) => {
    const staffId = Number(row.staff_id);
    const dept = String(row.department_code || '').trim();
    if (!Number.isFinite(staffId) || !dept) return;

    if (!staffByDepartment[dept]) staffByDepartment[dept] = new Set();
    staffByDepartment[dept].add(staffId);

    const year = yearFromSemester(row.semester);
    if (!yearsByStaffId[staffId]) yearsByStaffId[staffId] = new Set();
    if (year) yearsByStaffId[staffId].add(year);
  });

  const loadByStaffId = studentsRows.rows.reduce((acc, student) => {
    const staffId = Number(student.staff_id);
    if (Number.isFinite(staffId)) {
      acc[staffId] = (acc[staffId] || 0) + 1;
    }
    return acc;
  }, {});
  const assignedYearCountsByStaffId = {};
  studentsRows.rows.forEach((student) => {
    const staffId = Number(student.staff_id);
    const studentYear = yearFromSemester(student.semester);
    if (!Number.isFinite(staffId) || !Number.isFinite(studentYear)) return;
    if (!assignedYearCountsByStaffId[staffId]) assignedYearCountsByStaffId[staffId] = {};
    assignedYearCountsByStaffId[staffId][studentYear] = (assignedYearCountsByStaffId[staffId][studentYear] || 0) + 1;
  });
  const lockedYearByStaffId = Object.entries(assignedYearCountsByStaffId).reduce((acc, [staffId, yearCounts]) => {
    const dominantYear = pickDominantYear(yearCounts);
    if (Number.isFinite(dominantYear)) acc[staffId] = dominantYear;
    return acc;
  }, {});

  const updates = [];
  const unmatched = [];

  studentsRows.rows.forEach((student) => {
    const studentId = Number(student.id);
    const studentDept = String(student.department_code || '').trim();
    const studentYear = yearFromSemester(student.semester);
    const existingStaffId = Number(student.staff_id);
    const allDeptStaff = Array.from(staffByDepartment[studentDept] || []);

    if (!Number.isFinite(studentId) || !studentDept || allDeptStaff.length === 0) {
      unmatched.push({ student_id: studentId, usn: student.usn || null, reason: 'No matching staff in department' });
      return;
    }

    const yearMatchedStaff = allDeptStaff.filter((staffId) => {
      const supportedYears = yearsByStaffId[staffId] || new Set();
      return Boolean(studentYear) && supportedYears.has(studentYear);
    });
    const genericStaff = allDeptStaff.filter((staffId) => {
      const supportedYears = yearsByStaffId[staffId] || new Set();
      return supportedYears.size === 0;
    });

    // Prefer explicit year-matched staff; fallback to generic department staff.
    const candidateStaff = yearMatchedStaff.length > 0
      ? yearMatchedStaff
      : (genericStaff.length > 0 ? genericStaff : allDeptStaff);
    const oneYearCompatibleCandidates = candidateStaff.filter((staffId) => {
      const lockedYear = Number(lockedYearByStaffId[staffId]);
      if (!Number.isFinite(studentYear)) return !Number.isFinite(lockedYear);
      return !Number.isFinite(lockedYear) || lockedYear === studentYear;
    });
    const selectedStaff = chooseLeastLoadedStaff(oneYearCompatibleCandidates, loadByStaffId);
    if (!Number.isFinite(selectedStaff)) {
      unmatched.push({
        student_id: studentId,
        usn: student.usn || null,
        reason: 'Unable to select staff without mixing student years'
      });
      return;
    }

    if (Number.isFinite(existingStaffId) && existingStaffId === selectedStaff) return;

    updates.push({
      studentId,
      usn: student.usn || null,
      department: studentDept,
      year: studentYear,
      previousStaffId: Number.isFinite(existingStaffId) ? existingStaffId : null,
      newStaffId: selectedStaff
    });
    loadByStaffId[selectedStaff] = (loadByStaffId[selectedStaff] || 0) + 1;
    if (Number.isFinite(studentYear) && !Number.isFinite(Number(lockedYearByStaffId[selectedStaff]))) {
      lockedYearByStaffId[selectedStaff] = studentYear;
    }
    if (Number.isFinite(existingStaffId)) {
      loadByStaffId[existingStaffId] = Math.max(0, (loadByStaffId[existingStaffId] || 0) - 1);
    }
  });

  for (const row of updates) {
    await client.query('UPDATE students SET staff_id = $1 WHERE id = $2', [row.newStaffId, row.studentId]);
  }

  return { updates, unmatched };
};

const getStudents = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.user_id, s.usn, s.department, s.semester, s.staff_id,
              u.name, u.email, u.role
       FROM students s
       JOIN users u ON u.id = s.user_id
       ORDER BY s.id`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
};

const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT s.id, s.user_id, s.usn, s.department, s.semester, s.staff_id,
              u.name, u.email, u.role
       FROM students s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    return res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch student' });
  }
};

const createStudent = async (req, res) => {
  const { name, email, password, usn, department, semester, staff_id } = req.body;
  if (!name || !email || !password || !usn) {
    return res.status(400).json({ message: 'name, email, password and usn are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, 'student')
       RETURNING id, name, email, role`,
      [name, email, password]
    );
    const user = userResult.rows[0];

    const studentResult = await client.query(
      `INSERT INTO students (user_id, usn, department, semester, staff_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user.id, usn, department || null, parseIntOrNull(semester), parseIntOrNull(staff_id)]
    );

    await runAutoAssignment(client);
    await client.query('COMMIT');
    res.status(201).json({ user, student: studentResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Duplicate email/usn' });
    }
    return res.status(500).json({ message: 'Failed to create student' });
  } finally {
    client.release();
  }
};

const autoAssignStudentsToStaff = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { updates, unmatched } = await runAutoAssignment(client);

    await client.query('COMMIT');
    return res.json({
      message: 'Student-to-staff assignment completed',
      updated_count: updates.length,
      unmatched_count: unmatched.length,
      updated_students: updates,
      unmatched_students: unmatched
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: 'Failed to auto-assign students to staff' });
  } finally {
    client.release();
  }
};

const bulkAssignStudentsToStaff = async (req, res) => {
  const { student_ids, staff_id } = req.body;
  const studentIds = Array.isArray(student_ids)
    ? student_ids.map((value) => parseIntOrNull(value)).filter((value) => Number.isInteger(value) && value > 0)
    : [];
  const staffId = parseIntOrNull(staff_id);

  if (studentIds.length === 0 || !Number.isInteger(staffId) || staffId <= 0) {
    return res.status(400).json({ message: 'student_ids and staff_id are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const staffCheck = await client.query('SELECT id FROM staff WHERE id = ANY($1::int[])', [[staffId]]);
    if (staffCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Staff not found' });
    }

    const selectedStudents = await client.query(
      `SELECT id, semester
       FROM students
       WHERE id = ANY($1::int[])`,
      [studentIds]
    );
    if (selectedStudents.rows.length !== studentIds.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'One or more students not found' });
    }

    const selectedYears = Array.from(
      new Set(
        selectedStudents.rows
          .map((row) => yearFromSemester(row.semester))
          .filter((value) => Number.isFinite(value))
      )
    );
    if (selectedYears.length !== 1) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Selected students must all belong to the same year' });
    }
    const requestedYear = selectedYears[0];

    const existingStaffYearsResult = await client.query(
      `SELECT DISTINCT CEIL(semester::numeric / 2) AS year_level
       FROM students
       WHERE staff_id = $1
         AND semester IS NOT NULL`,
      [staffId]
    );
    const existingStaffYears = existingStaffYearsResult.rows
      .map((row) => Number(row.year_level))
      .filter((value) => Number.isFinite(value));
    const uniqueExistingYears = Array.from(new Set(existingStaffYears));
    if (uniqueExistingYears.length > 1) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Target staff already has multiple student years assigned' });
    }
    if (uniqueExistingYears.length === 1 && uniqueExistingYears[0] !== requestedYear) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        message: `Target staff is already assigned to Year ${uniqueExistingYears[0]}. Assign only Year ${uniqueExistingYears[0]} students.`
      });
    }

    const result = await client.query(
      `UPDATE students
       SET staff_id = $1
       WHERE id = ANY($2::int[])
       RETURNING id, usn, staff_id`,
      [staffId, studentIds]
    );

    await client.query('COMMIT');
    return res.json({
      message: 'Students assigned successfully',
      updated_count: result.rows.length,
      students: result.rows
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: 'Failed to assign students to staff' });
  } finally {
    client.release();
  }
};

const updateStudent = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, usn, department, semester, staff_id } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT user_id FROM students WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Student not found' });
    }
    const userId = existing.rows[0].user_id;

    if (name || email || password) {
      await client.query(
        `UPDATE users
         SET name = COALESCE($1, name),
             email = COALESCE($2, email),
             password = COALESCE($3, password),
             role = 'student'
         WHERE id = $4`,
        [name || null, email || null, password || null, userId]
      );
    }

    await client.query(
      `UPDATE students
       SET usn = COALESCE($1, usn),
           department = COALESCE($2, department),
           semester = COALESCE($3, semester),
           staff_id = COALESCE($4, staff_id)
       WHERE id = $5`,
      [usn || null, department || null, parseIntOrNull(semester), parseIntOrNull(staff_id), id]
    );

    const updated = await client.query(
      `SELECT s.id, s.user_id, s.usn, s.department, s.semester, s.staff_id,
              u.name, u.email, u.role
       FROM students s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = $1`,
      [id]
    );

    await runAutoAssignment(client);
    await client.query('COMMIT');
    return res.json(updated.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Duplicate email/usn' });
    }
    return res.status(500).json({ message: 'Failed to update student' });
  } finally {
    client.release();
  }
};

const deleteStudent = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT user_id FROM students WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Student not found' });
    }

    const userId = existing.rows[0].user_id;
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
    await client.query('COMMIT');
    return res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: 'Failed to delete student' });
  } finally {
    client.release();
  }
};

const getStaff = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT st.id, st.user_id, st.name, st.email, st.department_id,
              d.code AS department, d.name AS department_name,
              u.role,
              COALESCE(
                array_agg(DISTINCT sub.subject_name) FILTER (WHERE sub.subject_name IS NOT NULL),
                '{}'
              ) AS subjects
       FROM staff st
       LEFT JOIN departments d ON d.id = st.department_id
       LEFT JOIN users u ON u.id = st.user_id
       LEFT JOIN staff_subjects ss ON ss.staff_id = st.id
       LEFT JOIN subjects sub ON sub.id = ss.subject_id
       GROUP BY st.id, st.user_id, st.name, st.email, st.department_id, d.code, d.name, u.role
       ORDER BY st.id`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch staff' });
  }
};

const createStaff = async (req, res) => {
  const { name, email, password, staff_id, department } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email and password are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userResult = await client.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, 'staff')
       RETURNING id, name, email, role`,
      [name, email, password]
    );
    const user = userResult.rows[0];

    const requestedStaffId = parseIntOrNull(staff_id);
    const departmentId = await resolveDepartmentId(client, department);
    const staffResult = requestedStaffId
      ? await client.query(
          `INSERT INTO staff (id, name, email, user_id, department_id)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [requestedStaffId, name, email, user.id, departmentId]
        )
      : await client.query(
          `INSERT INTO staff (name, email, user_id, department_id)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [name, email, user.id, departmentId]
        );

    await runAutoAssignment(client);
    await client.query('COMMIT');
    res.status(201).json({ user, staff: staffResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Duplicate staff email or staff_id' });
    }
    return res.status(500).json({ message: 'Failed to create staff' });
  } finally {
    client.release();
  }
};

const updateStaff = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, department } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT user_id FROM staff WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Staff not found' });
    }
    const userId = existing.rows[0].user_id;

    await client.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           password = COALESCE($3, password),
           role = 'staff'
       WHERE id = $4`,
      [name || null, email || null, password || null, userId]
    );

    const departmentId = await resolveDepartmentId(client, department);
    await client.query(
      `UPDATE staff
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           department_id = COALESCE($3, department_id)
       WHERE id = $4`,
      [name || null, email || null, departmentId, id]
    );

    const updated = await client.query(
      `SELECT st.id, st.user_id, st.name, st.email, st.department_id,
              d.code AS department, d.name AS department_name
       FROM staff st
       LEFT JOIN departments d ON d.id = st.department_id
       WHERE st.id = $1`,
      [id]
    );
    await runAutoAssignment(client);
    await client.query('COMMIT');
    return res.json(updated.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Duplicate staff email' });
    }
    return res.status(500).json({ message: 'Failed to update staff' });
  } finally {
    client.release();
  }
};

const deleteStaff = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT user_id FROM staff WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Staff not found' });
    }
    await client.query('DELETE FROM users WHERE id = $1', [existing.rows[0].user_id]);
    await runAutoAssignment(client);
    await client.query('COMMIT');
    return res.json({ message: 'Staff deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: 'Failed to delete staff' });
  } finally {
    client.release();
  }
};

const getSubjects = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM subjects
       ORDER BY
         COALESCE(course, CASE
           WHEN subject_code LIKE 'MBBS%' THEN 'MBBS'
           WHEN subject_code LIKE 'MD%' THEN 'MD'
           ELSE ''
         END),
         CASE
           WHEN year = '1st' THEN 1
           WHEN year = '2nd' THEN 2
           WHEN year = '3rd' THEN 3
           WHEN year = 'Final' THEN 4
           WHEN year = 'Year 1' THEN 1
           WHEN year = 'Year 2' THEN 2
           ELSE 99
         END,
        subject_code,
        COALESCE(specialization, ''),
        id`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
};

const createSubject = async (req, res) => {
  const { subject_code, subject_name, max_marks, pass_marks, credits, course, year, specialization } = req.body;
  if (!subject_code || !subject_name || max_marks === undefined) {
    return res.status(400).json({ message: 'subject_code, subject_name and max_marks are required' });
  }
  try {
    const departmentId = await resolveDepartmentId(pool, course);
    const result = await pool.query(
      `INSERT INTO subjects (subject_code, subject_name, max_marks, pass_marks, credits, course, year, specialization, department_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        subject_code,
        subject_name,
        max_marks,
        parseIntOrNull(pass_marks),
        parseIntOrNull(credits),
        course || null,
        year || null,
        specialization || null,
        departmentId,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Duplicate subject_code or subject_name' });
    }
    res.status(500).json({ message: 'Failed to create subject' });
  }
};

const updateSubject = async (req, res) => {
  const { id } = req.params;
  const { subject_code, subject_name, max_marks, pass_marks, credits, course, year, specialization } = req.body;
  try {
    const departmentId =
      course === undefined || course === null || course === ''
        ? null
        : await resolveDepartmentId(pool, course);
    const result = await pool.query(
      `UPDATE subjects
       SET subject_code = COALESCE($1, subject_code),
           subject_name = COALESCE($2, subject_name),
           max_marks = COALESCE($3, max_marks),
           pass_marks = COALESCE($4, pass_marks),
           credits = COALESCE($5, credits),
           course = COALESCE($6, course),
           year = COALESCE($7, year),
           specialization = COALESCE($8, specialization),
           department_id = COALESCE($9, department_id)
       WHERE id = $10
       RETURNING *`,
      [
        subject_code || null,
        subject_name || null,
        parseIntOrNull(max_marks),
        parseIntOrNull(pass_marks),
        parseIntOrNull(credits),
        course || null,
        year || null,
        specialization || null,
        departmentId,
        id,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    return res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Duplicate subject_code or subject_name' });
    }
    return res.status(500).json({ message: 'Failed to update subject' });
  }
};

const deleteSubject = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM subjects WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    return res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to delete subject' });
  }
};

const getExams = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM exams ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch exams' });
  }
};

const createExam = async (req, res) => {
  const { exam_name, max_marks, exam_date } = req.body;
  if (!exam_name || max_marks === undefined) {
    return res.status(400).json({ message: 'exam_name and max_marks are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO exams (exam_name, max_marks, exam_date)
       VALUES ($1, $2, $3) RETURNING *`,
      [exam_name, max_marks, exam_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create exam' });
  }
};

const updateExam = async (req, res) => {
  const { id } = req.params;
  const { exam_name, max_marks, exam_date } = req.body;
  try {
    const result = await pool.query(
      `UPDATE exams
       SET exam_name = COALESCE($1, exam_name),
           max_marks = COALESCE($2, max_marks),
           exam_date = COALESCE($3, exam_date)
       WHERE id = $4
       RETURNING *`,
      [exam_name || null, parseIntOrNull(max_marks), exam_date || null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    return res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update exam' });
  }
};

const deleteExam = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM exams WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    return res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to delete exam' });
  }
};

const getMarks = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, s.usn, sub.subject_name, e.exam_name
       FROM marks m
       JOIN students s ON s.id = m.student_id
       JOIN subjects sub ON sub.id = m.subject_id
       JOIN exams e ON e.id = m.exam_id
       ORDER BY m.id DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch marks' });
  }
};

const createMark = async (req, res) => {
  const { student_id, subject_id, exam_id, marks_obtained } = req.body;
  if (!student_id || !subject_id || !exam_id || marks_obtained === undefined) {
    return res.status(400).json({ message: 'student_id, subject_id, exam_id and marks_obtained are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const examResult = await client.query('SELECT max_marks FROM exams WHERE id = $1', [exam_id]);
    if (examResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Invalid exam selected' });
    }
    const maxMarks = Number(examResult.rows[0].max_marks);
    const marksObtained = Number(marks_obtained);
    if (!Number.isFinite(marksObtained) || marksObtained < 0 || marksObtained > maxMarks) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `marks_obtained must be between 0 and ${maxMarks}` });
    }
    const normalized = normalizeScore(marksObtained, maxMarks);

    const result = await client.query(
      `INSERT INTO marks (student_id, subject_id, exam_id, marks_obtained, normalized_score)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [student_id, subject_id, exam_id, marksObtained, normalized]
    );
    await client.query('COMMIT');
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Marks already exist for this student/subject/exam' });
    }
    return res.status(500).json({ message: 'Failed to create mark' });
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
    await client.query('BEGIN');
    const existing = await client.query('SELECT exam_id FROM marks WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Mark not found' });
    }
    const examResult = await client.query('SELECT max_marks FROM exams WHERE id = $1', [existing.rows[0].exam_id]);
    const maxMarks = Number(examResult.rows[0].max_marks);
    const marksObtained = Number(marks_obtained);
    if (!Number.isFinite(marksObtained) || marksObtained < 0 || marksObtained > maxMarks) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `marks_obtained must be between 0 and ${maxMarks}` });
    }
    const normalized = normalizeScore(marksObtained, maxMarks);

    const result = await client.query(
      `UPDATE marks
       SET marks_obtained = $1,
           normalized_score = $2
       WHERE id = $3
       RETURNING *`,
      [marksObtained, normalized, id]
    );

    await client.query('COMMIT');
    return res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: 'Failed to update mark' });
  } finally {
    client.release();
  }
};

const deleteMark = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM marks WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Mark not found' });
    }
    return res.json({ message: 'Mark deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to delete mark' });
  }
};

const getNormalizationRules = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM normalization_rules ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch normalization rules' });
  }
};

const getStaffSubjects = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ss.id, ss.staff_id, ss.subject_id, ss.semester, ss.academic_year,
              st.name AS staff_name, st.email AS staff_email,
              (to_jsonb(sub) ->> 'subject_code') AS subject_code,
              sub.subject_name, sub.max_marks
       FROM staff_subjects ss
       JOIN staff st ON st.id = ss.staff_id
       JOIN subjects sub ON sub.id = ss.subject_id
       ORDER BY ss.id DESC`
    );
    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch staff-subject assignments' });
  }
};

const createStaffSubject = async (req, res) => {
  const { staff_id, subject_id, semester, academic_year } = req.body;
  if (!staff_id || !subject_id) {
    return res.status(400).json({ message: 'staff_id and subject_id are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const staffCheck = await client.query('SELECT id FROM staff WHERE id = $1', [staff_id]);
    if (staffCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Invalid staff_id' });
    }

    const subjectCheck = await client.query('SELECT id FROM subjects WHERE id = $1', [subject_id]);
    if (subjectCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Invalid subject_id' });
    }

    const semesterValue = parseIntOrNull(semester);
    const academicYearValue = academic_year || null;
    const duplicateCheck = await client.query(
      `SELECT id
       FROM staff_subjects
       WHERE staff_id = $1
         AND subject_id = $2
         AND semester IS NOT DISTINCT FROM $3
         AND academic_year IS NOT DISTINCT FROM $4
       LIMIT 1`,
      [staff_id, subject_id, semesterValue, academicYearValue]
    );
    if (duplicateCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Staff-subject assignment already exists' });
    }

    const result = await client.query(
      `INSERT INTO staff_subjects (staff_id, subject_id, semester, academic_year)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [staff_id, subject_id, semesterValue, academicYearValue]
    );

    await runAutoAssignment(client);
    await client.query('COMMIT');
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Staff-subject assignment already exists' });
    }
    return res.status(500).json({ message: 'Failed to create staff-subject assignment' });
  } finally {
    client.release();
  }
};

const deleteStaffSubject = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      'DELETE FROM staff_subjects WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Staff-subject assignment not found' });
    }
    await runAutoAssignment(client);
    await client.query('COMMIT');
    return res.json({ message: 'Staff-subject assignment deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: 'Failed to delete staff-subject assignment' });
  } finally {
    client.release();
  }
};

const createNormalizationRule = async (req, res) => {
  const { rule_name, method, config, is_active } = req.body;
  if (!rule_name || !method) {
    return res.status(400).json({ message: 'rule_name and method are required' });
  }
  try {
    if (is_active) {
      await pool.query('UPDATE normalization_rules SET is_active = false WHERE is_active = true');
    }
    const result = await pool.query(
      `INSERT INTO normalization_rules (rule_name, method, config, is_active, created_by)
       VALUES ($1, $2, $3::jsonb, $4, $5)
       RETURNING *`,
      [rule_name, method, JSON.stringify(config || {}), Boolean(is_active), req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create normalization rule' });
  }
};

const updateNormalizationRule = async (req, res) => {
  const { id } = req.params;
  const { rule_name, method, config, is_active } = req.body;
  try {
    if (is_active) {
      await pool.query('UPDATE normalization_rules SET is_active = false WHERE is_active = true AND id <> $1', [id]);
    }
    const result = await pool.query(
      `UPDATE normalization_rules
       SET rule_name = COALESCE($1, rule_name),
           method = COALESCE($2, method),
           config = COALESCE($3::jsonb, config),
           is_active = COALESCE($4, is_active)
       WHERE id = $5
       RETURNING *`,
      [rule_name || null, method || null, config ? JSON.stringify(config) : null, is_active, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Normalization rule not found' });
    }
    return res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update normalization rule' });
  }
};

const deleteNormalizationRule = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM normalization_rules WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Normalization rule not found' });
    }
    return res.json({ message: 'Normalization rule deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to delete normalization rule' });
  }
};

module.exports = {
  getStudents,
  getStudentById,
  autoAssignStudentsToStaff,
  bulkAssignStudentsToStaff,
  createStudent,
  updateStudent,
  deleteStudent,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getExams,
  createExam,
  updateExam,
  deleteExam,
  getMarks,
  createMark,
  updateMark,
  deleteMark,
  getStaffSubjects,
  createStaffSubject,
  deleteStaffSubject,
  getNormalizationRules,
  createNormalizationRule,
  updateNormalizationRule,
  deleteNormalizationRule,
  normalizeRole
};

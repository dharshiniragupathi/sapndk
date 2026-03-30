const pool = require('../config/db');

const escapeCsv = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const getMeritList = async (req, res) => {
  const { department, semester } = req.query;

  try {
    const params = [];
    const filters = [];
    if (department) {
      params.push(department);
      filters.push(`s.department = $${params.length}`);
    }
    if (semester) {
      params.push(Number(semester));
      filters.push(`s.semester = $${params.length}`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const query = `
      SELECT
        u.name,
        s.usn,
        s.department,
        s.semester,
        ROUND(AVG(m.normalized_score)::numeric, 2) AS final_normalized_score,
        RANK() OVER (ORDER BY AVG(m.normalized_score) DESC) AS rank
      FROM students s
      JOIN users u ON u.id = s.user_id
      JOIN marks m ON m.student_id = s.id
      ${whereClause}
      GROUP BY s.id, u.name, s.usn, s.department, s.semester
      ORDER BY rank, u.name`;

    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch merit list' });
  }
};

const getClassSummary = async (req, res) => {
  const { department, semester } = req.query;

  try {
    const params = [];
    const filters = [];
    if (department) {
      params.push(department);
      filters.push(`s.department = $${params.length}`);
    }
    if (semester) {
      params.push(Number(semester));
      filters.push(`s.semester = $${params.length}`);
    }
    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const summaryQuery = `
      SELECT
        COUNT(DISTINCT s.id) AS total_students,
        ROUND(AVG(m.normalized_score)::numeric, 2) AS class_average,
        ROUND(MIN(m.normalized_score)::numeric, 2) AS lowest_score,
        ROUND(MAX(m.normalized_score)::numeric, 2) AS highest_score
      FROM students s
      JOIN marks m ON m.student_id = s.id
      ${whereClause}`;

    const distributionQuery = `
      SELECT
        SUM(CASE WHEN avg_score >= 85 THEN 1 ELSE 0 END) AS excellent,
        SUM(CASE WHEN avg_score >= 75 AND avg_score < 85 THEN 1 ELSE 0 END) AS good,
        SUM(CASE WHEN avg_score >= 60 AND avg_score < 75 THEN 1 ELSE 0 END) AS average,
        SUM(CASE WHEN avg_score < 60 THEN 1 ELSE 0 END) AS below_average
      FROM (
        SELECT s.id, AVG(m.normalized_score) AS avg_score
        FROM students s
        JOIN marks m ON m.student_id = s.id
        ${whereClause}
        GROUP BY s.id
      ) t`;

    const [summary, distribution] = await Promise.all([
      pool.query(summaryQuery, params),
      pool.query(distributionQuery, params),
    ]);

    return res.json({
      summary: summary.rows[0],
      distribution: distribution.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch class summary' });
  }
};

const exportSubjectReportCsv = async (req, res) => {
  const { id } = req.params;
  const { exam_id, department, semester } = req.query;

  try {
    const params = [Number(id)];
    const filters = ['m.subject_id = $1'];
    if (exam_id) {
      params.push(Number(exam_id));
      filters.push(`m.exam_id = $${params.length}`);
    }
    if (department) {
      params.push(department);
      filters.push(`s.department = $${params.length}`);
    }
    if (semester) {
      params.push(Number(semester));
      filters.push(`s.semester = $${params.length}`);
    }

    const result = await pool.query(
      `SELECT u.name AS student_name, s.usn, s.department, s.semester,
              sub.subject_name, e.exam_name, m.marks_obtained, m.normalized_score
       FROM marks m
       JOIN students s ON s.id = m.student_id
       JOIN users u ON u.id = s.user_id
       JOIN subjects sub ON sub.id = m.subject_id
       JOIN exams e ON e.id = m.exam_id
       WHERE ${filters.join(' AND ')}
       ORDER BY u.name, e.id`,
      params
    );

    const header = [
      'Student Name',
      'USN',
      'Department',
      'Semester',
      'Subject',
      'Exam',
      'Marks Obtained',
      'Normalized Score',
    ];

    const rows = result.rows.map((row) => [
      row.student_name,
      row.usn,
      row.department,
      row.semester,
      row.subject_name,
      row.exam_name,
      row.marks_obtained,
      row.normalized_score,
    ]);

    const csv = [header, ...rows].map((line) => line.map(escapeCsv).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=subject_${id}_report.csv`);
    return res.status(200).send(csv);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to export subject report' });
  }
};

module.exports = {
  getMeritList,
  getClassSummary,
  exportSubjectReportCsv,
};

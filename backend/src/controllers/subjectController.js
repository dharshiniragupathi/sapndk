const pool = require('../config/db');

// Get all subjects
const getAllSubjects = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM subjects
       ORDER BY
         COALESCE(course, ''),
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

// Create a subject
const createSubjects = async (req, res) => {
  const { subject_code, subject_name, max_marks, pass_marks, credits, course, year, specialization } = req.body;

  // Validation
  if (!subject_code || !subject_name || max_marks === undefined) {
    return res.status(400).json({
      message: 'subject_code, subject_name and max_marks are required'
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO subjects (subject_code, subject_name, max_marks, pass_marks, credits, course, year, specialization)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [subject_code, subject_name, max_marks, pass_marks ?? null, credits ?? null, course ?? null, year ?? null, specialization ?? null]
    );

    res.status(201).json({
      message: 'Subject created successfully',
      subject: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Duplicate subject_code or subject_name' });
    }
    res.status(500).json({ message: 'Failed to create subject' });
  }
};

module.exports = {
  getAllSubjects,
  createSubjects,
};

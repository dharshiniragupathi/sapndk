const pool = require('../config/db');
const normalizeScore = require('../utils/normalize');

exports.addMarks = async (req, res) => {
    try {
        const { student_id, subject_id, exam_id, marks_obtained } = req.body;

        // 1️⃣ Get max marks of selected exam
        const examResult = await pool.query(
            'SELECT max_marks FROM exams WHERE id = $1',
            [exam_id]
        );

        if (examResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid exam selected' });
        }

        const maxMarks = Number(examResult.rows[0].max_marks);
        const parsedMarks = Number(marks_obtained);
        if (!Number.isFinite(parsedMarks) || parsedMarks < 0 || parsedMarks > maxMarks) {
            return res.status(400).json({ message: `marks_obtained must be between 0 and ${maxMarks}` });
        }

        // 2️⃣ Normalize score
        const normalized_score = normalizeScore(parsedMarks, maxMarks);

        // 3️⃣ Insert marks
        await pool.query(
            `INSERT INTO marks 
            (student_id, subject_id, exam_id, marks_obtained, normalized_score)
            VALUES ($1, $2, $3, $4, $5)`,
            [student_id, subject_id, exam_id, parsedMarks, normalized_score]
        );

        res.status(201).json({
            message: 'Marks added successfully',
            normalized_score
        });

    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({
                message: 'Marks already entered for this exam'
            });
        }
        res.status(500).json({ error: error.message });
    }
};

-- Ensure marks differ across exam and academic year/semester for each student.
-- This updates existing rows in `marks` using a deterministic semester-aware formula.

WITH computed AS (
  SELECT
    m.id,
    e.max_marks,
    (
      (
        ABS((m.student_id * 31) + (m.subject_id * 17) + (m.exam_id * 13) + (COALESCE(s.semester, 1) * 19))
        % ((e.max_marks - FLOOR(e.max_marks * 0.30)::int) + 1)
      )
      + FLOOR(e.max_marks * 0.30)::int
    )::int AS raw_marks
  FROM marks m
  JOIN students s ON s.id = m.student_id
  JOIN exams e ON e.id = m.exam_id
)
UPDATE marks m
SET marks_obtained = c.raw_marks,
    normalized_score = ROUND(((c.raw_marks::numeric / c.max_marks::numeric) * 100), 2)
FROM computed c
WHERE c.id = m.id;

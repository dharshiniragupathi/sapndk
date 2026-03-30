BEGIN;

UPDATE exams
SET max_marks = CASE
  WHEN REPLACE(LOWER(REGEXP_REPLACE(exam_name, '^(MBBS|MD)\s+', '', 'i')), ' ', '') IN ('internal1', 'internal2') THEN 50
  WHEN REPLACE(LOWER(REGEXP_REPLACE(exam_name, '^(MBBS|MD)\s+', '', 'i')), ' ', '') = 'midterm' THEN 75
  WHEN REPLACE(LOWER(REGEXP_REPLACE(exam_name, '^(MBBS|MD)\s+', '', 'i')), ' ', '') IN ('final', 'finalexam') THEN 100
  ELSE max_marks
END
WHERE REPLACE(LOWER(REGEXP_REPLACE(exam_name, '^(MBBS|MD)\s+', '', 'i')), ' ', '') IN ('internal1', 'internal2', 'midterm', 'final', 'finalexam');

UPDATE marks m
SET marks_obtained = LEAST(GREATEST(m.marks_obtained, 0), e.max_marks),
    normalized_score = ROUND(((LEAST(GREATEST(m.marks_obtained, 0), e.max_marks)::numeric / e.max_marks::numeric) * 100), 2)
FROM exams e
WHERE e.id = m.exam_id
  AND (
    m.marks_obtained < 0
    OR m.marks_obtained > e.max_marks
    OR m.normalized_score IS NULL
    OR ROUND(((m.marks_obtained::numeric / e.max_marks::numeric) * 100), 2) <> m.normalized_score
  );

COMMIT;

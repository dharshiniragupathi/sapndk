-- Remove duplicate staff-subject assignment rows and enforce uniqueness.

DELETE FROM staff_subjects a
USING staff_subjects b
WHERE a.id > b.id
  AND a.staff_id = b.staff_id
  AND a.subject_id = b.subject_id
  AND a.semester IS NOT DISTINCT FROM b.semester
  AND a.academic_year IS NOT DISTINCT FROM b.academic_year;

CREATE UNIQUE INDEX IF NOT EXISTS staff_subjects_unique_assignment_idx
ON staff_subjects (
  staff_id,
  subject_id,
  COALESCE(semester, -1),
  COALESCE(academic_year, '')
);

-- Seed MBBS and MD subjects with explicit curriculum metadata.
-- Requires subjects.subject_code, course, pass_marks, credits, and year to exist.

INSERT INTO subjects (subject_code, subject_name, course, max_marks, pass_marks, credits, year, specialization)
VALUES
  ('MBBS101', 'Anatomy', 'MBBS', 100, 50, 4, '1st', NULL),
  ('MBBS102', 'Physiology', 'MBBS', 100, 50, 4, '1st', NULL),
  ('MBBS103', 'Biochemistry', 'MBBS', 100, 50, 3, '1st', NULL),
  ('MBBS201', 'Pathology', 'MBBS', 150, 75, 5, '2nd', NULL),
  ('MBBS202', 'Pharmacology', 'MBBS', 150, 75, 5, '2nd', NULL),
  ('MBBS203', 'Microbiology', 'MBBS', 100, 50, 4, '2nd', NULL),
  ('MBBS204', 'Forensic Medicine', 'MBBS', 100, 50, 4, '2nd', NULL),
  ('MBBS301', 'Community Medicine', 'MBBS', 150, 75, 5, '3rd', NULL),
  ('MBBS302', 'Ophthalmology', 'MBBS', 100, 50, 4, '3rd', NULL),
  ('MBBS303', 'ENT', 'MBBS', 100, 50, 4, '3rd', NULL),
  ('MBBS401', 'General Medicine', 'MBBS', 150, 75, 5, 'Final', NULL),
  ('MBBS402', 'General Surgery', 'MBBS', 150, 75, 5, 'Final', NULL),
  ('MBBS403', 'OBG', 'MBBS', 100, 50, 4, 'Final', NULL),
  ('MBBS404', 'Pediatrics', 'MBBS', 100, 50, 4, 'Final', NULL),
  ('MBBS405', 'Orthopedics', 'MBBS', 100, 50, 4, 'Final', NULL),
  ('MD101', 'Advanced Pathology', 'MD', 200, 100, 6, 'Year 1', 'General Medicine, Pediatrics, Dermatology, Psychiatry'),
  ('MD102', 'Clinical Medicine', 'MD', 200, 100, 6, 'Year 1', 'General Medicine, Pediatrics, Psychiatry'),
  ('MD103', 'Advanced Pharmacology', 'MD', 150, 75, 5, 'Year 1', 'General Medicine, Pediatrics, Dermatology, Psychiatry, Radiology, Anesthesiology'),
  ('MD104', 'Research Methodology', 'MD', 100, 50, 4, 'Year 1', 'General Medicine, Pediatrics, Dermatology, Psychiatry, Radiology, Anesthesiology'),
  ('MD105', 'Diagnostic Procedures', 'MD', 150, 75, 5, 'Year 1', 'General Medicine, Pediatrics, Radiology, Anesthesiology'),
  ('MD106', 'Medical Ethics', 'MD', 100, 50, 3, 'Year 2', 'General Medicine, Pediatrics, Dermatology, Psychiatry, Radiology, Anesthesiology'),
  ('MD107', 'Critical Care', 'MD', 200, 100, 6, 'Year 2', 'General Medicine, Pediatrics, Anesthesiology'),
  ('MD108', 'Advanced Radiology', 'MD', 150, 75, 5, 'Year 2', 'Radiology, General Medicine, Pediatrics'),
  ('MD109', 'Hospital Management', 'MD', 100, 50, 4, 'Year 2', 'General Medicine, Pediatrics, Dermatology, Psychiatry, Radiology, Anesthesiology'),
  ('MD110', 'Thesis Evaluation', 'MD', 200, 100, 6, 'Year 2', 'General Medicine, Pediatrics, Dermatology, Psychiatry, Radiology, Anesthesiology')
ON CONFLICT (subject_code)
DO UPDATE SET
  subject_name = EXCLUDED.subject_name,
  course = EXCLUDED.course,
  max_marks = EXCLUDED.max_marks,
  pass_marks = EXCLUDED.pass_marks,
  credits = EXCLUDED.credits,
  year = EXCLUDED.year,
  specialization = EXCLUDED.specialization;

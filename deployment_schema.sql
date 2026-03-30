-- Student Academic Performance Normalizer - Consolidated Deployment Schema
-- Target: Supabase / PostgreSQL

BEGIN;

CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'staff', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  usn VARCHAR(50) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  department VARCHAR(50),
  semester INTEGER,
  staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  subject_code VARCHAR(50) UNIQUE NOT NULL,
  subject_name VARCHAR(255) NOT NULL,
  max_marks INTEGER NOT NULL,
  pass_marks INTEGER,
  credits INTEGER,
  course VARCHAR(100),
  year VARCHAR(50),
  specialization VARCHAR(255),
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS exams (
  id SERIAL PRIMARY KEY,
  exam_name VARCHAR(255) NOT NULL,
  max_marks INTEGER NOT NULL,
  exam_date DATE
);

CREATE TABLE IF NOT EXISTS marks (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
  marks_obtained NUMERIC NOT NULL,
  normalized_score NUMERIC
);

CREATE TABLE IF NOT EXISTS staff_subjects (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  semester INTEGER,
  academic_year VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS student_queries (
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
);

CREATE UNIQUE INDEX IF NOT EXISTS staff_subjects_unique_assignment_idx
ON staff_subjects (
  staff_id,
  subject_id,
  COALESCE(semester, -1),
  COALESCE(academic_year, '')
);

CREATE INDEX IF NOT EXISTS idx_marks_student_id ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_subject_id ON marks(subject_id);
CREATE INDEX IF NOT EXISTS idx_marks_exam_id ON marks(exam_id);

INSERT INTO subjects (subject_code, subject_name, course, max_marks, pass_marks, credits, year, specialization)
VALUES
  ('MBBS101', 'Anatomy', 'MBBS', 100, 50, 4, '1st', NULL),
  ('MBBS102', 'Physiology', 'MBBS', 100, 50, 4, '1st', NULL),
  ('MBBS103', 'Biochemistry', 'MBBS', 100, 50, 3, '1st', NULL)
ON CONFLICT (subject_code) DO NOTHING;

COMMIT;

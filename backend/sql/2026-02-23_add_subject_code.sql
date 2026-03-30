-- Add subject_code to subjects table and enforce uniqueness.
-- Run this once in your PostgreSQL database.

ALTER TABLE subjects
ADD COLUMN IF NOT EXISTS subject_code VARCHAR(50);

-- Backfill missing codes from current names to avoid NULL data.
UPDATE subjects
SET subject_code = UPPER(REGEXP_REPLACE(subject_name, '[^A-Za-z0-9]+', '_', 'g'))
WHERE subject_code IS NULL OR TRIM(subject_code) = '';

ALTER TABLE subjects
ALTER COLUMN subject_code SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'subjects_subject_code_key'
  ) THEN
    ALTER TABLE subjects
    ADD CONSTRAINT subjects_subject_code_key UNIQUE (subject_code);
  END IF;
END $$;

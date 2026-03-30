-- Add curriculum metadata to subjects and backfill existing rows.

ALTER TABLE subjects
ADD COLUMN IF NOT EXISTS course VARCHAR(50);

ALTER TABLE subjects
ADD COLUMN IF NOT EXISTS pass_marks INTEGER;

ALTER TABLE subjects
ADD COLUMN IF NOT EXISTS credits INTEGER;

ALTER TABLE subjects
ADD COLUMN IF NOT EXISTS year VARCHAR(20);

UPDATE subjects
SET
  course = COALESCE(
    NULLIF(TRIM(course), ''),
    CASE
      WHEN subject_code LIKE 'MBBS%' THEN 'MBBS'
      WHEN subject_code LIKE 'MD%' THEN 'MD'
      ELSE NULL
    END
  ),
  pass_marks = COALESCE(pass_marks, GREATEST(1, CEIL(max_marks * 0.5))::INTEGER),
  credits = COALESCE(credits, CASE WHEN max_marks >= 150 THEN 5 ELSE 4 END),
  year = COALESCE(
    NULLIF(TRIM(year), ''),
    CASE
      WHEN subject_code LIKE 'MBBS1%' THEN '1st'
      WHEN subject_code LIKE 'MBBS2%' THEN '2nd'
      WHEN subject_code LIKE 'MBBS3%' THEN '3rd'
      WHEN subject_code LIKE 'MBBS4%' THEN 'Final'
      WHEN subject_code LIKE 'MD1%' THEN 'Year 1'
      WHEN subject_code LIKE 'MD2%' THEN 'Year 2'
      ELSE NULL
    END
  );

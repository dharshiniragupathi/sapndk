-- Add specialization grouping to subjects and backfill MD catalog.

ALTER TABLE subjects
ADD COLUMN IF NOT EXISTS specialization TEXT;

UPDATE subjects
SET specialization = CASE subject_code
  WHEN 'MD101' THEN 'General Medicine, Pediatrics, Dermatology, Psychiatry'
  WHEN 'MD102' THEN 'General Medicine, Pediatrics, Psychiatry'
  WHEN 'MD103' THEN 'General Medicine, Pediatrics, Dermatology, Psychiatry, Radiology, Anesthesiology'
  WHEN 'MD104' THEN 'General Medicine, Pediatrics, Dermatology, Psychiatry, Radiology, Anesthesiology'
  WHEN 'MD105' THEN 'General Medicine, Pediatrics, Radiology, Anesthesiology'
  WHEN 'MD106' THEN 'General Medicine, Pediatrics, Dermatology, Psychiatry, Radiology, Anesthesiology'
  WHEN 'MD107' THEN 'General Medicine, Pediatrics, Anesthesiology'
  WHEN 'MD108' THEN 'Radiology, General Medicine, Pediatrics'
  WHEN 'MD109' THEN 'General Medicine, Pediatrics, Dermatology, Psychiatry, Radiology, Anesthesiology'
  WHEN 'MD110' THEN 'General Medicine, Pediatrics, Dermatology, Psychiatry, Radiology, Anesthesiology'
  ELSE specialization
END
WHERE subject_code LIKE 'MD%';

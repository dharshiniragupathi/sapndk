-- Student Academic Performance Normalizer - Initial Admin Seed
-- Pass: admin123
-- Hash: $2b$10$5du07SMf3qJDdCiLwXTInR4romcxZkVyA.lRUbQuCldkf7I

BEGIN;

INSERT INTO users (name, email, password, role)
VALUES (
  'Admin One', 
  'admin1@avp.bitsathy.ac.in', 
  '$2b$10$Fv.OTUJBjSM8ADJHz8GUferoqp4CPuoXU2FP9K.i78', 
  'admin'
)
ON CONFLICT (email) DO UPDATE 
SET password = EXCLUDED.password, role = 'admin';

COMMIT;

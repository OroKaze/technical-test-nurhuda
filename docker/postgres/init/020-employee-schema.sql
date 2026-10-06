\connect employee_db

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS employee_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  company_email VARCHAR(255) NOT NULL UNIQUE,
  photo_url TEXT,
  position VARCHAR(150) NOT NULL,
  phone_number VARCHAR(30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_profiles_user_id ON employee_profiles (user_id);

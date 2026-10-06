\connect attendance_db

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  attendance_date DATE NOT NULL,
  attendance_time TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('CHECK_IN', 'CHECK_OUT')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, attendance_date, status)
);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_date
  ON attendance_records (employee_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_date
  ON attendance_records (attendance_date);

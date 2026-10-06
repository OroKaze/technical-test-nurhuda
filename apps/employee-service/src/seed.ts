import { Pool } from 'pg';

async function seed(): Promise<void> {
  const pool = new Pool({ connectionString: requireEnvironment('EMPLOYEE_DATABASE_URL') });

  try {
    await pool.query(
      `INSERT INTO employee_profiles
        (id, user_id, full_name, company_email, photo_url, position, phone_number)
       VALUES
        ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001',
         'Employee Name', 'employee@dexagroup.com', NULL, 'Software Developer', '+628123456789')
       ON CONFLICT (user_id) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         company_email = EXCLUDED.company_email,
         position = EXCLUDED.position,
         phone_number = EXCLUDED.phone_number,
         updated_at = NOW()`,
    );
  } finally {
    await pool.end();
  }
}

function requireEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

void seed();

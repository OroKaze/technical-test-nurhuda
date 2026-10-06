import { Pool } from 'pg';
import { Argon2PasswordHasher } from './modules/auth/password-hasher';

const seedUsers = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'employee@dexagroup.com',
    password: 'Employee123!',
    role: 'EMPLOYEE',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'hrd@dexagroup.com',
    password: 'HrdEmployee123!',
    role: 'HRD',
  },
] as const;

async function seed(): Promise<void> {
  const pool = new Pool({ connectionString: requireEnvironment('IDENTITY_DATABASE_URL') });
  const hasher = new Argon2PasswordHasher();

  try {
    for (const user of seedUsers) {
      const passwordHash = await hasher.hash(user.password);
      await pool.query(
        `INSERT INTO users (id, company_email, password_hash, role, is_active)
         VALUES ($1, $2, $3, $4, TRUE)
         ON CONFLICT (id) DO UPDATE SET
           company_email = EXCLUDED.company_email,
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role,
           is_active = TRUE,
           updated_at = NOW()`,
        [user.id, user.email, passwordHash, user.role],
      );
    }
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

import { Pool } from 'pg';
import type { UserAccount, UserRepository } from '../modules/auth/auth.types';

export class PostgresUserRepository implements UserRepository {
  constructor(private readonly pool: Pool) {}

  async findByCompanyEmail(companyEmail: string): Promise<UserAccount | null> {
    const result = await this.pool.query<UserAccountRow>(
      `SELECT id, company_email, password_hash, role, is_active
       FROM users
       WHERE company_email = $1
       LIMIT 1`,
      [companyEmail],
    );
    return result.rows[0] ? toUserAccount(result.rows[0]) : null;
  }

  async findById(id: string): Promise<UserAccount | null> {
    const result = await this.pool.query<UserAccountRow>(
      `SELECT id, company_email, password_hash, role, is_active
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [id],
    );
    return result.rows[0] ? toUserAccount(result.rows[0]) : null;
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.pool.query(
      `UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1`,
      [id, passwordHash],
    );
  }

  async create(params: { companyEmail: string; passwordHash: string; role: UserAccount['role'] }): Promise<UserAccount> {
    const result = await this.pool.query<UserAccountRow>(
      `INSERT INTO users (company_email, password_hash, role, is_active)
       VALUES ($1, $2, $3, TRUE)
       RETURNING id, company_email, password_hash, role, is_active`,
      [params.companyEmail, params.passwordHash, params.role],
    );
    const row = result.rows[0];
    if (!row) throw new Error('User creation returned no row');
    return toUserAccount(row);
  }
}

type UserAccountRow = {
  id: string;
  company_email: string;
  password_hash: string;
  role: UserAccount['role'];
  is_active: boolean;
};

function toUserAccount(row: UserAccountRow): UserAccount {
  return {
    id: row.id,
    companyEmail: row.company_email,
    passwordHash: row.password_hash,
    role: row.role,
    isActive: row.is_active,
  };
}

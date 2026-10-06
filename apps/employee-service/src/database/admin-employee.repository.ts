import { Pool } from 'pg';
import type { EmployeeProfile } from '../modules/employees/employee-profile.types';
import type { AdminEmployeeListQuery, AdminEmployeeRepository, UpdateEmployeeParams } from '../modules/employees/admin-employee.types';

type ProfileRow = {
  id: string;
  user_id: string;
  full_name: string;
  company_email: string;
  photo_url: string | null;
  position: string;
  phone_number: string | null;
};

export class PostgresAdminEmployeeRepository implements AdminEmployeeRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(query: AdminEmployeeListQuery): Promise<{ rows: EmployeeProfile[]; total: number }> {
    const offset = (query.page - 1) * query.limit;
    const [countResult, dataResult] = await Promise.all([
      this.pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM employee_profiles'),
      this.pool.query<ProfileRow>(
        `SELECT id, user_id, full_name, company_email, photo_url, position, phone_number
         FROM employee_profiles ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [query.limit, offset],
      ),
    ]);
    return {
      rows: dataResult.rows.map(toProfile),
      total: Number(countResult.rows[0]?.count ?? 0),
    };
  }

  async findById(id: string): Promise<EmployeeProfile | null> {
    const result = await this.pool.query<ProfileRow>(
      `SELECT id, user_id, full_name, company_email, photo_url, position, phone_number
       FROM employee_profiles WHERE id = $1 LIMIT 1`,
      [id],
    );
    return result.rows[0] ? toProfile(result.rows[0]) : null;
  }

  async findByCompanyEmail(email: string): Promise<EmployeeProfile | null> {
    const result = await this.pool.query<ProfileRow>(
      `SELECT id, user_id, full_name, company_email, photo_url, position, phone_number
       FROM employee_profiles WHERE company_email = $1 LIMIT 1`,
      [email],
    );
    return result.rows[0] ? toProfile(result.rows[0]) : null;
  }

  async create(params: {
    userId: string;
    fullName: string;
    companyEmail: string;
    position: string;
    phoneNumber?: string;
  }): Promise<EmployeeProfile> {
    const result = await this.pool.query<ProfileRow>(
      `INSERT INTO employee_profiles (user_id, full_name, company_email, position, phone_number)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, full_name, company_email, photo_url, position, phone_number`,
      [params.userId, params.fullName, params.companyEmail, params.position, params.phoneNumber ?? null],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Employee profile creation returned no row');
    return toProfile(row);
  }

  async update(id: string, changes: UpdateEmployeeParams): Promise<EmployeeProfile> {
    const result = await this.pool.query<ProfileRow>(
      `UPDATE employee_profiles
       SET full_name = COALESCE($2, full_name),
           position = COALESCE($3, position),
           phone_number = CASE WHEN $4::boolean THEN $5 ELSE phone_number END,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, user_id, full_name, company_email, photo_url, position, phone_number`,
      [
        id,
        changes.fullName ?? null,
        changes.position ?? null,
        changes.phoneNumber !== undefined,
        changes.phoneNumber ?? null,
      ],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Employee profile update returned no row');
    return toProfile(row);
  }
}

function toProfile(row: ProfileRow): EmployeeProfile {
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    companyEmail: row.company_email,
    photoUrl: row.photo_url,
    position: row.position,
    phoneNumber: row.phone_number,
  };
}

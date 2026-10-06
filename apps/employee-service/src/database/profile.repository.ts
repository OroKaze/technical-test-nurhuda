import { Pool, type PoolClient } from 'pg';
import type { EmployeeProfile, EmployeeProfileRepository } from '../modules/employees/employee-profile.types';
import type { OutboxEventInput } from '../modules/events/outbox.types';

type ProfileRow = {
  id: string;
  user_id: string;
  full_name: string;
  company_email: string;
  photo_url: string | null;
  position: string;
  phone_number: string | null;
};

export class PostgresEmployeeProfileRepository implements EmployeeProfileRepository {
  constructor(private readonly pool: Pool) {}

  async findByUserId(userId: string): Promise<EmployeeProfile | null> {
    const result = await this.pool.query<ProfileRow>(
      `SELECT id, user_id, full_name, company_email, photo_url, position, phone_number
       FROM employee_profiles WHERE user_id = $1 LIMIT 1`,
      [userId],
    );
    return result.rows[0] ? toProfile(result.rows[0]) : null;
  }

  async updateSelfProfile(
    userId: string,
    changes: { phoneNumber?: string | null; photoUrl?: string | null },
  ): Promise<EmployeeProfile> {
    const result = await this.pool.query<ProfileRow>(
      `UPDATE employee_profiles
       SET phone_number = COALESCE($2, phone_number),
           photo_url = COALESCE($3, photo_url),
           updated_at = NOW()
       WHERE user_id = $1
       RETURNING id, user_id, full_name, company_email, photo_url, position, phone_number`,
      [userId, changes.phoneNumber ?? null, changes.photoUrl ?? null],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Profile update returned no row');
    return toProfile(row);
  }

  async updateSelfProfileWithOutbox(
    userId: string,
    changes: { phoneNumber?: string | null; photoUrl?: string | null },
    event: OutboxEventInput,
  ): Promise<EmployeeProfile> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query<ProfileRow>(
        `UPDATE employee_profiles
         SET phone_number = COALESCE($2, phone_number),
             photo_url = COALESCE($3, photo_url),
             updated_at = NOW()
         WHERE user_id = $1
         RETURNING id, user_id, full_name, company_email, photo_url, position, phone_number`,
        [userId, changes.phoneNumber ?? null, changes.photoUrl ?? null],
      );
      const row = result.rows[0];
      if (!row) throw new Error('Profile update returned no row');

      await client.query(
        `INSERT INTO outbox_events
          (event_type, aggregate_type, aggregate_id, payload, occurred_at, actor_id, correlation_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [event.eventType, event.aggregateType, event.aggregateId, JSON.stringify(event.payload), event.occurredAt, event.actorId, event.correlationId],
      );
      await client.query('COMMIT');
      return toProfile(row);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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

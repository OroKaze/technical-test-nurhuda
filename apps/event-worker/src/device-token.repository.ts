import { Pool } from 'pg';
import type { DeviceTokenStore } from './device-token.service';

export class PostgresDeviceTokenStore implements DeviceTokenStore {
  constructor(private readonly pool: Pool) {}

  async upsert(userId: string, token: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO device_tokens (user_id, token, is_active, last_seen_at)
       VALUES ($1, $2, TRUE, NOW())
       ON CONFLICT (token) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         is_active = TRUE,
         last_seen_at = NOW(),
         updated_at = NOW()`,
      [userId, token],
    );
  }

  async deactivate(userId: string, token: string): Promise<void> {
    await this.pool.query(
      `UPDATE device_tokens SET is_active = FALSE, updated_at = NOW()
       WHERE user_id = $1 AND token = $2`,
      [userId, token],
    );
  }
}

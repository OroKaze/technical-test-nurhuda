import { Pool } from 'pg';
import type { DeliveryRecord, DeliveryStatus, NotificationDeliveryStore } from './notification.consumer';

export class PostgresNotificationDeliveryStore implements NotificationDeliveryStore {
  constructor(private readonly pool: Pool) {}

  async activeHrdTokens(): Promise<string[]> {
    const result = await this.pool.query<{ token: string }>(
      `SELECT token FROM device_tokens WHERE is_active = TRUE`,
    );
    return result.rows.map((row) => row.token);
  }

  async getDelivery(eventId: string, token: string): Promise<DeliveryRecord | null> {
    const result = await this.pool.query<{ status: string; attempt_count: number }>(
      `SELECT status, attempt_count FROM notification_deliveries WHERE event_id = $1 AND device_token = $2`,
      [eventId, token],
    );
    const row = result.rows[0];
    if (!row) return null;
    return { status: row.status as DeliveryStatus, attemptCount: row.attempt_count };
  }

  async createPending(value: { eventId: string; token: string }): Promise<void> {
    await this.pool.query(
      `INSERT INTO notification_deliveries (event_id, device_token, status)
       VALUES ($1, $2, 'PENDING') ON CONFLICT (event_id, device_token) DO NOTHING`,
      [value.eventId, value.token],
    );
  }

  async markSent(eventId: string, token: string): Promise<void> {
    await this.pool.query(
      `UPDATE notification_deliveries
       SET status = 'SENT', sent_at = NOW(), attempt_count = attempt_count + 1
       WHERE event_id = $1 AND device_token = $2`,
      [eventId, token],
    );
  }

  async markFailed(eventId: string, token: string, error: string): Promise<void> {
    await this.pool.query(
      `UPDATE notification_deliveries
       SET status = 'FAILED', last_error = $3, attempt_count = attempt_count + 1
       WHERE event_id = $1 AND device_token = $2`,
      [eventId, token, error],
    );
  }

  async deactivateToken(token: string): Promise<void> {
    await this.pool.query(
      `UPDATE device_tokens SET is_active = FALSE, updated_at = NOW() WHERE token = $1`,
      [token],
    );
  }
}

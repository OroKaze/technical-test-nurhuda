import { Pool } from 'pg';
import type { AttendanceOutboxPublisherStore, AttendancePendingOutboxEvent } from './attendance-outbox.publisher';

type OutboxRow = {
  id: string;
  event_type: AttendancePendingOutboxEvent['eventType'];
  aggregate_id: string;
  payload: Record<string, unknown>;
  occurred_at: string | Date;
  actor_id: string | null;
  correlation_id: string;
};

export class PostgresAttendanceOutboxPublisherStore implements AttendanceOutboxPublisherStore {
  constructor(private readonly pool: Pool) {}

  async claimPending(limit: number): Promise<AttendancePendingOutboxEvent[]> {
    const result = await this.pool.query<OutboxRow>(
      `SELECT id, event_type, aggregate_id, payload, occurred_at, actor_id, correlation_id
       FROM outbox_events
       WHERE published_at IS NULL
       ORDER BY created_at
       LIMIT $1
       FOR UPDATE SKIP LOCKED`,
      [limit],
    );
    return result.rows.map((row) => ({
      id: row.id,
      eventType: row.event_type,
      aggregateId: row.aggregate_id,
      payload: row.payload,
      occurredAt: row.occurred_at instanceof Date ? row.occurred_at : new Date(row.occurred_at),
      actorId: row.actor_id,
      correlationId: row.correlation_id,
    }));
  }

  async markPublished(id: string): Promise<void> {
    await this.pool.query('UPDATE outbox_events SET published_at = NOW(), last_error = NULL WHERE id = $1', [id]);
  }

  async markFailed(id: string, error: string): Promise<void> {
    await this.pool.query(
      'UPDATE outbox_events SET attempt_count = attempt_count + 1, last_error = $2 WHERE id = $1',
      [id, error],
    );
  }
}

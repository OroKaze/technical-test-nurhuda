import { Pool } from 'pg';
import type { DomainEvent } from '@dexa/contracts';
import type { AuditEventStore } from './audit-event.consumer';

export class PostgresAuditEventStore implements AuditEventStore {
  constructor(private readonly pool: Pool) {}

  async isDuplicate(eventId: string): Promise<boolean> {
    const result = await this.pool.query('SELECT 1 FROM audit_logs WHERE event_id = $1 LIMIT 1', [eventId]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async persist(event: DomainEvent): Promise<void> {
    await this.pool.query(
      `INSERT INTO audit_logs
        (event_id, event_type, actor_id, aggregate_type, aggregate_id, payload, occurred_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (event_id) DO NOTHING`,
      [
        event.eventId,
        event.eventType,
        event.actorId,
        event.aggregateType,
        event.aggregateId,
        JSON.stringify(event.payload),
        event.occurredAt,
      ],
    );
  }
}

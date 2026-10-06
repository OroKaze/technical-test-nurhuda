import { Pool, type PoolClient } from 'pg';
import type { OutboxEventInput, OutboxRepository } from './outbox.types';

export class PostgresOutboxRepository implements OutboxRepository {
  constructor(private readonly pool: Pool) {}

  async insert(client: unknown, event: OutboxEventInput): Promise<void> {
    const executor = (client as PoolClient | null) ?? this.pool;
    await executor.query(
      `INSERT INTO outbox_events
        (event_type, aggregate_type, aggregate_id, payload, occurred_at, actor_id, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        event.eventType,
        event.aggregateType,
        event.aggregateId,
        JSON.stringify(event.payload),
        event.occurredAt,
        event.actorId,
        event.correlationId,
      ],
    );
  }
}

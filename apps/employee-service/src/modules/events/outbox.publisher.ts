import type { DomainEventType } from '@dexa/contracts';

export interface PendingOutboxEvent {
  id: string;
  eventType: DomainEventType;
  aggregateType: 'EMPLOYEE' | 'ATTENDANCE';
  aggregateId: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
  actorId: string | null;
  correlationId: string;
}

export interface OutboxPublisherStore {
  claimPending(limit: number): Promise<PendingOutboxEvent[]>;
  markPublished(id: string): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
}

export interface DomainEventPublisher {
  publish(routingKey: string, event: Record<string, unknown>): Promise<void>;
}

export class OutboxPublisher {
  constructor(
    private readonly store: OutboxPublisherStore,
    private readonly broker: DomainEventPublisher,
  ) {}

  async publishBatch(limit = 50): Promise<void> {
    const pending = await this.store.claimPending(limit);
    for (const event of pending) {
      try {
        await this.broker.publish(event.eventType, {
          eventId: event.id,
          schemaVersion: 1,
          eventType: event.eventType,
          occurredAt: event.occurredAt.toISOString(),
          actorId: event.actorId,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
          correlationId: event.correlationId,
          payload: event.payload,
        });
        await this.store.markPublished(event.id);
      } catch (error) {
        await this.store.markFailed(event.id, sanitizeError(error));
      }
    }
  }
}

function sanitizeError(error: unknown): string {
  if (error instanceof Error) return error.message.slice(0, 500);
  return 'Outbox publication failed';
}

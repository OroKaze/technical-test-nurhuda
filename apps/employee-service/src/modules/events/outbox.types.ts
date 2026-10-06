import type { DomainEvent } from '@dexa/contracts';

export interface OutboxEventInput {
  eventType: DomainEvent['eventType'];
  aggregateType: DomainEvent['aggregateType'];
  aggregateId: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
  actorId: string | null;
  correlationId: string;
}

export interface OutboxRepository {
  insert(client: unknown, event: OutboxEventInput): Promise<void>;
}

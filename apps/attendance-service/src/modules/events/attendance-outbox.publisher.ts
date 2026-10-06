import type { DomainEventType } from '@dexa/contracts';

export interface AttendancePendingOutboxEvent {
  id: string;
  eventType: Extract<DomainEventType, 'attendance.checked.in' | 'attendance.checked.out'>;
  aggregateId: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
  actorId: string | null;
  correlationId: string;
}

export interface AttendanceOutboxPublisherStore {
  claimPending(limit: number): Promise<AttendancePendingOutboxEvent[]>;
  markPublished(id: string): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
}

export interface AttendanceDomainEventPublisher {
  publish(routingKey: string, event: Record<string, unknown>): Promise<void>;
}

export class AttendanceOutboxPublisher {
  constructor(
    private readonly store: AttendanceOutboxPublisherStore,
    private readonly broker: AttendanceDomainEventPublisher,
  ) {}

  async publishBatch(limit = 50): Promise<void> {
    const pending = await this.store.claimPending(limit);
    for (const item of pending) {
      try {
        await this.broker.publish(item.eventType, {
          eventId: item.id,
          schemaVersion: 1,
          eventType: item.eventType,
          occurredAt: item.occurredAt.toISOString(),
          actorId: item.actorId,
          aggregateType: 'ATTENDANCE',
          aggregateId: item.aggregateId,
          correlationId: item.correlationId,
          payload: item.payload,
        });
        await this.store.markPublished(item.id);
      } catch (error) {
        await this.store.markFailed(item.id, error instanceof Error ? error.message.slice(0, 500) : 'Publication failed');
      }
    }
  }
}

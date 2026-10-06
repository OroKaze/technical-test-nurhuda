import type { DomainEvent } from '@dexa/contracts';

export interface AuditEventStore {
  persist(event: DomainEvent): Promise<void>;
  isDuplicate?(eventId: string): Promise<boolean>;
}

export class AuditEventConsumer {
  constructor(private readonly store: AuditEventStore) {}

  async consume(event: DomainEvent): Promise<void> {
    if (this.store.isDuplicate && await this.store.isDuplicate(event.eventId)) return;
    await this.store.persist(sanitizeEvent(event));
  }
}

function sanitizeEvent(event: DomainEvent): DomainEvent {
  return {
    ...event,
    payload: JSON.parse(JSON.stringify(event.payload, (key, value) =>
      /password|token|secret|privateKey/i.test(key) ? undefined : value,
    )),
  };
}

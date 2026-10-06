import type { DomainEvent } from '@dexa/contracts';

export type DeliveryStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface DeliveryRecord {
  status: DeliveryStatus;
  attemptCount: number;
}

export interface NotificationDeliveryStore {
  activeHrdTokens(): Promise<string[]>;
  getDelivery(eventId: string, token: string): Promise<DeliveryRecord | null>;
  createPending(value: { eventId: string; token: string }): Promise<void>;
  markSent(eventId: string, token: string): Promise<void>;
  markFailed(eventId: string, token: string, error: string): Promise<void>;
  deactivateToken(token: string): Promise<void>;
}

export interface NotificationProvider {
  send(token: string, message: { title: string; body: string }): Promise<void>;
}

export class InvalidDeviceTokenError extends Error {
  constructor() {
    super('The device token is no longer valid.');
    this.name = 'InvalidDeviceTokenError';
  }
}

export interface NotificationConsumeOutcome {
  retry: boolean;
}

export class NotificationConsumer {
  constructor(
    private readonly deliveries: NotificationDeliveryStore,
    private readonly provider: NotificationProvider,
    private readonly maxAttempts = 3,
  ) {}

  async consume(event: DomainEvent): Promise<NotificationConsumeOutcome> {
    if (event.eventType !== 'employee.profile.updated') return { retry: false };

    let retry = false;
    const tokens = await this.deliveries.activeHrdTokens();
    for (const token of tokens) {
      const delivery = await this.deliveries.getDelivery(event.eventId, token);
      if (delivery?.status === 'SENT') continue;
      if (delivery && delivery.attemptCount >= this.maxAttempts) continue;

      if (!delivery) {
        await this.deliveries.createPending({ eventId: event.eventId, token });
      }

      try {
        await this.provider.send(token, {
          title: 'Employee profile changed',
          body: 'An employee updated their profile information.',
        });
        await this.deliveries.markSent(event.eventId, token);
      } catch (error) {
        await this.deliveries.markFailed(event.eventId, token, sanitizeError(error));
        if (error instanceof InvalidDeviceTokenError) {
          await this.deliveries.deactivateToken(token);
        } else {
          retry = true;
        }
      }
    }
    return { retry };
  }
}

function sanitizeError(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 500) : 'Notification delivery failed';
}

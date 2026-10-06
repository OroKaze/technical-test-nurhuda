import test from 'node:test';
import assert from 'node:assert/strict';
import { InvalidDeviceTokenError, NotificationConsumer } from '../src/notification.consumer';
import type { DeliveryRecord, NotificationDeliveryStore } from '../src/notification.consumer';
import type { DomainEvent } from '@dexa/contracts';

const event: DomainEvent = {
  eventId: 'event-1',
  eventType: 'employee.profile.updated',
  schemaVersion: 1,
  occurredAt: '2026-10-05T00:00:00.000Z',
  actorId: 'user-1',
  aggregateType: 'EMPLOYEE',
  aggregateId: 'profile-1',
  correlationId: 'corr-1',
  payload: { changedFields: ['phoneNumber'] },
};

interface TestStore extends NotificationDeliveryStore {
  deliveries: Map<string, DeliveryRecord>;
  deactivated: string[];
  sends: string[];
}

function store(overrides: Partial<NotificationDeliveryStore> = {}): TestStore {
  const deliveries = new Map<string, DeliveryRecord>();
  const deactivated: string[] = [];
  const sends: string[] = [];
  const key = (eventId: string, token: string) => `${eventId}|${token}`;
  return {
    deliveries,
    deactivated,
    sends,
    activeHrdTokens: async () => ['token-1', 'token-2'],
    getDelivery: async (eventId, token) => deliveries.get(key(eventId, token)) ?? null,
    createPending: async ({ eventId, token }) => {
      deliveries.set(key(eventId, token), { status: 'PENDING', attemptCount: 0 });
    },
    markSent: async (eventId, token) => {
      const k = key(eventId, token);
      deliveries.set(k, { status: 'SENT', attemptCount: (deliveries.get(k)?.attemptCount ?? 0) + 1 });
    },
    markFailed: async (eventId, token) => {
      const k = key(eventId, token);
      deliveries.set(k, { status: 'FAILED', attemptCount: (deliveries.get(k)?.attemptCount ?? 0) + 1 });
    },
    deactivateToken: async (token) => { deactivated.push(token); },
    ...overrides,
  };
}

test('sends profile-change notification to every active HRD token', async () => {
  const deliveries = store();
  const consumer = new NotificationConsumer(deliveries, {
    send: async (token) => { deliveries.sends.push(token); },
  });

  const outcome = await consumer.consume(event);

  assert.deepEqual(deliveries.sends, ['token-1', 'token-2']);
  assert.equal(deliveries.deliveries.get('event-1|token-1')?.status, 'SENT');
  assert.equal(deliveries.deliveries.get('event-1|token-2')?.status, 'SENT');
  assert.equal(outcome.retry, false);
});

test('ignores events that are not profile updates', async () => {
  const deliveries = store();
  const consumer = new NotificationConsumer(deliveries, { send: async () => {} });

  const outcome = await consumer.consume({ ...event, eventType: 'attendance.checked.in' });

  assert.equal(deliveries.sends.length, 0);
  assert.equal(outcome.retry, false);
});

test('skips a delivery that was already sent', async () => {
  const deliveries = store();
  deliveries.deliveries.set('event-1|token-1', { status: 'SENT', attemptCount: 1 });
  deliveries.deliveries.set('event-1|token-2', { status: 'SENT', attemptCount: 1 });
  const consumer = new NotificationConsumer(deliveries, {
    send: async (token) => { deliveries.sends.push(token); },
  });

  const outcome = await consumer.consume(event);

  assert.equal(deliveries.sends.length, 0);
  assert.equal(outcome.retry, false);
});

test('retries a failed delivery whose attempt count is below the limit', async () => {
  const deliveries = store();
  deliveries.deliveries.set('event-1|token-1', { status: 'FAILED', attemptCount: 1 });
  deliveries.deliveries.set('event-1|token-2', { status: 'FAILED', attemptCount: 2 });
  const consumer = new NotificationConsumer(deliveries, {
    send: async (token) => { deliveries.sends.push(token); },
  });

  const outcome = await consumer.consume(event);

  assert.deepEqual(deliveries.sends, ['token-1', 'token-2']);
  assert.equal(deliveries.deliveries.get('event-1|token-1')?.status, 'SENT');
  assert.equal(outcome.retry, false);
});

test('stops retrying once the attempt limit is exhausted', async () => {
  const deliveries = store();
  deliveries.deliveries.set('event-1|token-1', { status: 'FAILED', attemptCount: 3 });
  deliveries.deliveries.set('event-1|token-2', { status: 'FAILED', attemptCount: 3 });
  const consumer = new NotificationConsumer(deliveries, {
    send: async (token) => { deliveries.sends.push(token); },
  });

  const outcome = await consumer.consume(event);

  assert.equal(deliveries.sends.length, 0);
  assert.equal(outcome.retry, false);
  assert.equal(deliveries.deliveries.get('event-1|token-1')?.status, 'FAILED');
});

test('requests a retry when the provider fails transiently', async () => {
  const deliveries = store();
  const consumer = new NotificationConsumer(deliveries, {
    send: async () => { throw new Error('firebase unavailable'); },
  });

  const outcome = await consumer.consume(event);

  assert.equal(outcome.retry, true);
  assert.equal(deliveries.deliveries.get('event-1|token-1')?.status, 'FAILED');
  assert.equal(deliveries.deliveries.get('event-1|token-1')?.attemptCount, 1);
  assert.deepEqual(deliveries.deactivated, []);
});

test('deactivates the token and does not retry when the provider reports an invalid token', async () => {
  const deliveries = store();
  const consumer = new NotificationConsumer(deliveries, {
    send: async (token) => {
      if (token === 'token-1') throw new InvalidDeviceTokenError();
    },
  });

  const outcome = await consumer.consume(event);

  assert.deepEqual(deliveries.deactivated, ['token-1']);
  assert.equal(deliveries.deliveries.get('event-1|token-1')?.status, 'FAILED');
  assert.equal(deliveries.deliveries.get('event-1|token-2')?.status, 'SENT');
  assert.equal(outcome.retry, false);
});

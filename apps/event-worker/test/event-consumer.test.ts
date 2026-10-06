import test from 'node:test';
import assert from 'node:assert/strict';
import { AuditEventConsumer } from '../src/audit-event.consumer';
import type { DomainEvent } from '@dexa/contracts';

test('persists a sanitized audit event', async () => {
  const persisted: unknown[] = [];
  const consumer = new AuditEventConsumer({
    persist: async (event) => { persisted.push(event); },
  });
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
  await consumer.consume(event);
  assert.equal(persisted.length, 1);
  assert.deepEqual(persisted[0], event);
});

test('duplicate event is treated as an idempotent success', async () => {
  let calls = 0;
  const consumer = new AuditEventConsumer({
    persist: async () => { calls += 1; },
    isDuplicate: async () => true,
  });
  await consumer.consume({} as DomainEvent);
  assert.equal(calls, 0);
});

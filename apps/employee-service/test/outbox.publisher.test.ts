import test from 'node:test';
import assert from 'node:assert/strict';
import { OutboxPublisher } from '../src/modules/events/outbox.publisher';

test('publishes pending outbox events and marks them published', async () => {
  const published: unknown[] = [];
  const marked: string[] = [];
  const publisher = new OutboxPublisher({
    claimPending: async () => [{
      id: 'outbox-1', eventType: 'employee.profile.updated', aggregateType: 'EMPLOYEE', aggregateId: 'profile-1',
      payload: { changedFields: ['phoneNumber'] }, occurredAt: new Date('2026-10-05T00:00:00Z'), actorId: 'user-1', correlationId: 'corr-1',
    }],
    markPublished: async (id) => { marked.push(id); },
    markFailed: async () => {},
  }, {
    publish: async (routingKey, event) => { published.push({ routingKey, event }); },
  });
  await publisher.publishBatch();
  assert.equal(marked[0], 'outbox-1');
  assert.equal((published[0] as { routingKey: string }).routingKey, 'employee.profile.updated');
});

test('records a failure and does not mark event published when broker fails', async () => {
  const failures: Array<{ id: string; error: string }> = [];
  const marked: string[] = [];
  const publisher = new OutboxPublisher({
    claimPending: async () => [{
      id: 'outbox-2', eventType: 'employee.profile.updated', aggregateType: 'EMPLOYEE', aggregateId: 'profile-1',
      payload: {}, occurredAt: new Date(), actorId: null, correlationId: 'corr-2',
    }],
    markPublished: async (id) => { marked.push(id); },
    markFailed: async (id, error) => { failures.push({ id, error }); },
  }, { publish: async () => { throw new Error('broker unavailable'); } });
  await publisher.publishBatch();
  assert.deepEqual(marked, []);
  assert.deepEqual(failures, [{ id: 'outbox-2', error: 'broker unavailable' }]);
});

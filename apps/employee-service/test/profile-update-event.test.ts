import test from 'node:test';
import assert from 'node:assert/strict';
import { EmployeeProfileService } from '../src/modules/employees/employee-profile.service';
import type { EmployeeProfile, EmployeeProfileRepository } from '../src/modules/employees/employee-profile.types';
import type { OutboxRepository } from '../src/modules/events/outbox.types';

const profile: EmployeeProfile = {
  id: 'profile-1',
  userId: 'user-1',
  fullName: 'Employee Name',
  companyEmail: 'employee@dexagroup.com',
  photoUrl: null,
  position: 'Engineer',
  phoneNumber: '+628111111',
};

test('profile update emits sanitized employee.profile.updated outbox event', async () => {
  const events: Array<Record<string, unknown>> = [];
  const profiles: EmployeeProfileRepository = {
    findByUserId: async () => profile,
    updateSelfProfile: async () => ({ ...profile, phoneNumber: '+628222222' }),
  };
  const outbox: OutboxRepository = {
    insert: async (_client, event) => {
      events.push(event as unknown as Record<string, unknown>);
    },
  };
  const service = new EmployeeProfileService(profiles, outbox);

  await service.updateOwnProfile('user-1', { phoneNumber: '+628222222' }, 'request-1');

  assert.equal(events.length, 1);
  assert.equal(events[0]?.eventType, 'employee.profile.updated');
  assert.equal(events[0]?.actorId, 'user-1');
  assert.deepEqual(events[0]?.payload, { changedFields: ['phoneNumber'] });
  assert.equal(JSON.stringify(events[0]).includes('password'), false);
});

test('profile read does not emit an event', async () => {
  let eventCount = 0;
  const profiles: EmployeeProfileRepository = {
    findByUserId: async () => profile,
    updateSelfProfile: async () => profile,
  };
  const outbox: OutboxRepository = {
    insert: async () => { eventCount += 1; },
  };
  const service = new EmployeeProfileService(profiles, outbox);
  await service.getOwnProfile('user-1');
  assert.equal(eventCount, 0);
});

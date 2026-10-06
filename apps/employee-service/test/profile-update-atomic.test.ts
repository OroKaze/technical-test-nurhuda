import test from 'node:test';
import assert from 'node:assert/strict';
import { EmployeeProfileService } from '../src/modules/employees/employee-profile.service';
import type { EmployeeProfile, EmployeeProfileRepository } from '../src/modules/employees/employee-profile.types';

test('uses the transactional profile update boundary when available', async () => {
  const profile: EmployeeProfile = {
    id: 'profile-1', userId: 'user-1', fullName: 'Employee',
    companyEmail: 'employee@dexagroup.com', photoUrl: null,
    position: 'Engineer', phoneNumber: null,
  };
  let transactionalCalls = 0;
  const repository: EmployeeProfileRepository & {
    updateSelfProfileWithOutbox: (...args: unknown[]) => Promise<EmployeeProfile>;
  } = {
    findByUserId: async () => profile,
    updateSelfProfile: async () => { throw new Error('non-transactional path used'); },
    updateSelfProfileWithOutbox: async () => {
      transactionalCalls += 1;
      return { ...profile, phoneNumber: '+628222222' };
    },
  };
  const outbox = { insert: async () => { throw new Error('separate outbox path used'); } };
  const service = new EmployeeProfileService(repository, outbox);

  const updated = await service.updateOwnProfile('user-1', { phoneNumber: '+628222222' }, 'corr-1');

  assert.equal(transactionalCalls, 1);
  assert.equal(updated.phoneNumber, '+628222222');
});

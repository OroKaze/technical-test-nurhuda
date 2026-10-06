import test from 'node:test';
import assert from 'node:assert/strict';
import { EmployeeProfileService } from '../src/modules/employees/employee-profile.service';
import type { EmployeeProfile, EmployeeProfileRepository } from '../src/modules/employees/employee-profile.types';

const profile: EmployeeProfile = {
  id: 'profile-1',
  userId: 'user-1',
  fullName: 'Employee Name',
  companyEmail: 'employee@company.example',
  photoUrl: null,
  position: 'Software Developer',
  phoneNumber: '+628123456789',
};

function createService(found: EmployeeProfile | null = profile) {
  const repository: EmployeeProfileRepository = {
    findByUserId: async () => found,
    updateSelfProfile: async () => profile,
  };
  return new EmployeeProfileService(repository);
}

test('returns the authenticated employee profile', async () => {
  const result = await createService().getOwnProfile('user-1');
  assert.deepEqual(result, profile);
});

test('does not return another employee profile as self-service data', async () => {
  await assert.rejects(() => createService(null).getOwnProfile('user-1'), {
    code: 'PROFILE_NOT_FOUND',
  });
});

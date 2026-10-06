import test from 'node:test';
import assert from 'node:assert/strict';
import { EmployeeManagementService } from '../src/modules/employees/admin-employee.service';
import type {
  AdminEmployeeRepository,
  IdentityAccountClient,
} from '../src/modules/employees/admin-employee.types';
import type { EmployeeProfile } from '../src/modules/employees/employee-profile.types';

function profileOf(overrides: Partial<EmployeeProfile> = {}): EmployeeProfile {
  return {
    id: 'profile-1',
    userId: 'user-1',
    fullName: 'New Employee',
    companyEmail: 'new@dexagroup.com',
    photoUrl: null,
    position: 'QA Engineer',
    phoneNumber: null,
    ...overrides,
  };
}

function createService(options: { identityDuplicate?: boolean } = {}) {
  const state = {
    profiles: [] as EmployeeProfile[],
    identityCalls: 0,
  };

  const identity: IdentityAccountClient = {
    createAccount: async () => {
      state.identityCalls += 1;
      if (options.identityDuplicate) {
        const error = new Error('duplicate') as Error & { code?: string };
        error.code = 'EMAIL_ALREADY_EXISTS';
        throw error;
      }
      return { id: 'user-new' };
    },
  };

  const repository: AdminEmployeeRepository = {
    findAll: async () => ({ rows: state.profiles, total: state.profiles.length }),
    findById: async (id) => state.profiles.find((profile) => profile.id === id) ?? null,
    findByCompanyEmail: async (email) =>
      state.profiles.find((profile) => profile.companyEmail === email) ?? null,
    create: async (params) => {
      const created = profileOf({
        userId: params.userId,
        fullName: params.fullName,
        companyEmail: params.companyEmail,
        position: params.position,
        phoneNumber: params.phoneNumber ?? null,
      });
      state.profiles.push(created);
      return created;
    },
    update: async (id, changes) => {
      const existing = state.profiles.find((profile) => profile.id === id);
      if (!existing) throw new Error('missing');
      return { ...existing, ...changes };
    },
  };

  return {
    service: new EmployeeManagementService(repository, identity, 'dexagroup.com'),
    state,
  };
}

test('creates an employee by provisioning an identity account first', async () => {
  const { service, state } = createService();
  const profile = await service.createEmployee({
    fullName: 'New Employee',
    companyEmail: 'new@dexagroup.com',
    password: 'Password123!',
    position: 'QA Engineer',
  });

  assert.equal(state.identityCalls, 1);
  assert.equal(profile.userId, 'user-new');
  assert.equal(profile.companyEmail, 'new@dexagroup.com');
});

test('rejects employee creation with a non-company email and skips identity provisioning', async () => {
  const { service, state } = createService();
  await assert.rejects(
    () =>
      service.createEmployee({
        fullName: 'New Employee',
        companyEmail: 'new@gmail.com',
        password: 'Password123!',
        position: 'QA Engineer',
      }),
    { code: 'INVALID_COMPANY_EMAIL' },
  );
  assert.equal(state.identityCalls, 0);
});

test('rejects employee creation when the email already exists in the identity service', async () => {
  const { service } = createService({ identityDuplicate: true });
  await assert.rejects(
    () =>
      service.createEmployee({
        fullName: 'New Employee',
        companyEmail: 'new@dexagroup.com',
        password: 'Password123!',
        position: 'QA Engineer',
      }),
    { code: 'EMPLOYEE_EMAIL_EXISTS' },
  );
});

test('rejects employee creation when a profile with the email already exists', async () => {
  const { service, state } = createService();
  state.profiles.push(profileOf());
  await assert.rejects(
    () =>
      service.createEmployee({
        fullName: 'Another',
        companyEmail: 'new@dexagroup.com',
        password: 'Password123!',
        position: 'QA Engineer',
      }),
    { code: 'EMPLOYEE_EMAIL_EXISTS' },
  );
  assert.equal(state.identityCalls, 0);
});

test('updates allowed employee fields', async () => {
  const { service, state } = createService();
  state.profiles.push(profileOf());
  const updated = await service.updateEmployee('profile-1', {
    fullName: 'Renamed Employee',
    position: 'Senior QA',
    phoneNumber: '+628111111',
  });
  assert.equal(updated.fullName, 'Renamed Employee');
  assert.equal(updated.position, 'Senior QA');
  assert.equal(updated.phoneNumber, '+628111111');
});

test('updating a missing employee throws PROFILE_NOT_FOUND', async () => {
  const { service } = createService();
  await assert.rejects(
    () => service.updateEmployee('missing', { fullName: 'X' }),
    { code: 'PROFILE_NOT_FOUND' },
  );
});

test('lists employees with pagination metadata', async () => {
  const { service, state } = createService();
  state.profiles.push(profileOf(), profileOf({ id: 'profile-2', companyEmail: 'b@dexagroup.com' }));
  const result = await service.listEmployees({});
  assert.equal(result.meta.total, 2);
  assert.equal(result.meta.page, 1);
  assert.equal(result.meta.limit, 50);
  assert.equal(result.data.length, 2);
});

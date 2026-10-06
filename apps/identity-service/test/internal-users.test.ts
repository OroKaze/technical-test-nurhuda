import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../src/modules/auth/auth.service';
import type { UserAccount, UserRepository } from '../src/modules/auth/auth.types';
import type { AccessTokenClaims, AccessTokenService } from '../src/modules/auth/jwt-token';
import type { PasswordHasher } from '../src/modules/auth/password-hasher';

function createService(overrides: { existing?: UserAccount | null } = {}) {
  const created: Array<{ companyEmail: string; passwordHash: string; role: string }> = [];
  const repository: UserRepository = {
    findByCompanyEmail: async () => overrides.existing ?? null,
    findById: async () => overrides.existing ?? null,
    updatePasswordHash: async () => {},
    create: async (params) => {
      created.push(params);
      return {
        id: 'user-new',
        companyEmail: params.companyEmail,
        passwordHash: params.passwordHash,
        role: params.role,
        isActive: true,
      };
    },
  };
  const passwords: PasswordHasher = {
    hash: async (password) => `hashed:${password}`,
    verify: async () => true,
  };
  const tokens: AccessTokenService = {
    sign: (_claims: AccessTokenClaims) => 'token',
    verify: () => {
      throw new Error('not used');
    },
  };
  return {
    service: new AuthService(repository, passwords, tokens, 'dexagroup.com'),
    created,
  };
}

test('creates an employee account with a hashed password and no hash in the response', async () => {
  const { service, created } = createService();
  const user = await service.createUser('new@dexagroup.com', 'Password123!', 'EMPLOYEE');

  assert.equal(user.id, 'user-new');
  assert.equal(user.email, 'new@dexagroup.com');
  assert.equal(user.role, 'EMPLOYEE');
  assert.equal(created[0]?.passwordHash, 'hashed:Password123!');
  assert.equal('passwordHash' in user, false);
});

test('rejects a non-company email domain', async () => {
  const { service, created } = createService();
  await assert.rejects(
    () => service.createUser('new@gmail.com', 'Password123!', 'EMPLOYEE'),
    { code: 'INVALID_COMPANY_EMAIL' },
  );
  assert.equal(created.length, 0);
});

test('rejects a duplicate company email', async () => {
  const existing: UserAccount = {
    id: 'user-1',
    companyEmail: 'dup@dexagroup.com',
    passwordHash: 'hash',
    role: 'EMPLOYEE',
    isActive: true,
  };
  const { service } = createService({ existing });
  await assert.rejects(
    () => service.createUser('dup@dexagroup.com', 'Password123!', 'EMPLOYEE'),
    { code: 'EMAIL_ALREADY_EXISTS' },
  );
});

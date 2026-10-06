import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../src/modules/auth/auth.service';
import type { UserAccount, UserRepository } from '../src/modules/auth/auth.types';
import type { AccessTokenClaims, AccessTokenService } from '../src/modules/auth/jwt-token';
import type { PasswordHasher } from '../src/modules/auth/password-hasher';

const user: UserAccount = {
  id: 'user-1',
  companyEmail: 'employee@company.example',
  passwordHash: 'stored-hash',
  role: 'EMPLOYEE',
  isActive: true,
};

function createDependencies(overrides: Partial<{
  user: UserAccount | null;
  validPassword: boolean;
}> = {}) {
  const currentUser = overrides.user === undefined ? user : overrides.user;
  const updatedHashes: string[] = [];
  const signedClaims: AccessTokenClaims[] = [];

  const repository: UserRepository = {
    findByCompanyEmail: async () => currentUser,
    findById: async () => currentUser,
    updatePasswordHash: async (_id, hash) => { updatedHashes.push(hash); },
    create: async (params) => ({
      id: 'created-user',
      companyEmail: params.companyEmail,
      passwordHash: params.passwordHash,
      role: params.role,
      isActive: true,
    }),
  };
  const passwords: PasswordHasher = {
    hash: async (value) => `hashed:${value}`,
    verify: async () => overrides.validPassword ?? true,
  };
  const tokens: AccessTokenService = {
    sign: (claims) => { signedClaims.push(claims); return 'signed-token'; },
    verify: () => { throw new Error('not used'); },
  };

  return {
    auth: new AuthService(repository, passwords, tokens, 'company.example'),
    updatedHashes,
    signedClaims,
  };
}

test('logs in and returns only public user fields', async () => {
  const { auth, signedClaims } = createDependencies();
  const result = await auth.login(' EMPLOYEE@COMPANY.EXAMPLE ', 'password');

  assert.deepEqual(result.user, {
    id: 'user-1',
    email: 'employee@company.example',
    role: 'EMPLOYEE',
  });
  assert.equal(result.accessToken, 'signed-token');
  assert.deepEqual(signedClaims, [{ sub: 'user-1', email: 'employee@company.example', role: 'EMPLOYEE' }]);
  assert.equal('passwordHash' in result.user, false);
});

test('rejects invalid password with a generic authentication error', async () => {
  const { auth } = createDependencies({ validPassword: false });
  await assert.rejects(() => auth.login(user.companyEmail, 'wrong'), { code: 'INVALID_CREDENTIALS' });
});

test('rejects an inactive account', async () => {
  const { auth } = createDependencies({ user: { ...user, isActive: false } });
  await assert.rejects(() => auth.login(user.companyEmail, 'password'), { code: 'ACCOUNT_INACTIVE' });
});

test('changes password only after validating the current password', async () => {
  const { auth, updatedHashes } = createDependencies();
  await auth.changePassword(user.id, 'old-password', 'new-password');

  assert.deepEqual(updatedHashes, ['hashed:new-password']);
});

test('rejects password change when current password is invalid', async () => {
  const { auth, updatedHashes } = createDependencies({ validPassword: false });
  await assert.rejects(() => auth.changePassword(user.id, 'wrong', 'new-password'), {
    code: 'CURRENT_PASSWORD_INVALID',
  });
  assert.deepEqual(updatedHashes, []);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { HrdGuard } from '../src/modules/auth/hrd.guard';

function createContext(user?: { role?: string }): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

test('allows HRD users', () => {
  assert.equal(new HrdGuard().canActivate(createContext({ role: 'HRD' })), true);
});

test('rejects employee users with 403', () => {
  assert.throws(() => new HrdGuard().canActivate(createContext({ role: 'EMPLOYEE' })), ForbiddenException);
});

test('rejects missing user with 403', () => {
  assert.throws(() => new HrdGuard().canActivate(createContext()), ForbiddenException);
});

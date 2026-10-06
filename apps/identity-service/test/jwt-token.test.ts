import test from 'node:test';
import assert from 'node:assert/strict';
import { JwtAccessTokenService } from '../src/modules/auth/jwt-token';

test('signs and verifies an access token with user identity and role', () => {
  const tokens = new JwtAccessTokenService('test-secret');
  const token = tokens.sign({ sub: 'user-1', email: 'employee@dexagroup.com', role: 'EMPLOYEE' });

  const claims = tokens.verify(token);

  assert.equal(claims.sub, 'user-1');
  assert.equal(claims.email, 'employee@dexagroup.com');
  assert.equal(claims.role, 'EMPLOYEE');
  assert.equal(typeof (claims as unknown as { iat: number }).iat, 'number');
  assert.equal(typeof (claims as unknown as { exp: number }).exp, 'number');
});

test('rejects a token signed with another secret', () => {
  const trusted = new JwtAccessTokenService('trusted-secret');
  const untrusted = new JwtAccessTokenService('untrusted-secret');
  const token = untrusted.sign({ sub: 'user-1', email: 'employee@dexagroup.com', role: 'EMPLOYEE' });

  assert.throws(() => trusted.verify(token));
});

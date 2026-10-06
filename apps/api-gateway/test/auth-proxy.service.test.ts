import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthProxyService } from '../src/auth-proxy.service';

test('forwards login requests to identity service and returns its response', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const proxy = new AuthProxyService('http://identity-service:3001', async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ accessToken: 'token' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });

  const result = await proxy.forward('login', { email: 'employee@company.example', password: 'password' });

  assert.deepEqual(result, { status: 200, body: { accessToken: 'token' } });
  assert.equal(calls[0]?.url, 'http://identity-service:3001/api/v1/auth/login');
  assert.equal(calls[0]?.init?.method, 'POST');
});

test('preserves identity service error status and body', async () => {
  const proxy = new AuthProxyService('http://identity-service:3001', async () => new Response(
    JSON.stringify({ code: 'INVALID_CREDENTIALS' }),
    { status: 401, headers: { 'content-type': 'application/json' } },
  ));

  const result = await proxy.forward('login', { email: 'employee@company.example', password: 'wrong' });

  assert.deepEqual(result, { status: 401, body: { code: 'INVALID_CREDENTIALS' } });
});

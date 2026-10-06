import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { DeviceTokenHttpHandler } from '../src/device-token.http';

const SECRET = 'test-secret';

function hrdToken(sub = 'hrd-1'): string {
  return jwt.sign({ sub, role: 'HRD' }, SECRET);
}

function employeeToken(): string {
  return jwt.sign({ sub: 'emp-1', role: 'EMPLOYEE' }, SECRET);
}

function recorder() {
  const calls: Array<{ op: string; userId: string; token: string }> = [];
  return {
    calls,
    service: {
      register: async (userId: string, token: string) => { calls.push({ op: 'register', userId, token }); },
      remove: async (userId: string, token: string) => { calls.push({ op: 'remove', userId, token }); },
    },
  };
}

test('requires a bearer token for device registration', async () => {
  const { service } = recorder();
  const handler = new DeviceTokenHttpHandler(service, SECRET);
  const response = await handler.handle({
    method: 'POST',
    url: '/internal/notifications/device-tokens',
    headers: {},
    body: { token: 'browser-token' },
  });
  assert.equal(response.status, 401);
});

test('registers a device token using the authenticated HRD subject', async () => {
  const { service, calls } = recorder();
  const handler = new DeviceTokenHttpHandler(service, SECRET);
  const response = await handler.handle({
    method: 'POST',
    url: '/internal/notifications/device-tokens',
    headers: { authorization: `Bearer ${hrdToken()}` },
    body: { token: 'browser-token' },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(calls, [{ op: 'register', userId: 'hrd-1', token: 'browser-token' }]);
});

test('rejects an employee token with 403', async () => {
  const { service } = recorder();
  const handler = new DeviceTokenHttpHandler(service, SECRET);
  const response = await handler.handle({
    method: 'POST',
    url: '/internal/notifications/device-tokens',
    headers: { authorization: `Bearer ${employeeToken()}` },
    body: { token: 'browser-token' },
  });
  assert.equal(response.status, 403);
});

test('deactivates a token on DELETE for the authenticated user', async () => {
  const { service, calls } = recorder();
  const handler = new DeviceTokenHttpHandler(service, SECRET);
  const response = await handler.handle({
    method: 'DELETE',
    url: '/internal/notifications/device-tokens',
    headers: { authorization: `Bearer ${hrdToken('hrd-9')}` },
    body: { token: 'browser-token' },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(calls, [{ op: 'remove', userId: 'hrd-9', token: 'browser-token' }]);
});

test('rejects a request without a token body', async () => {
  const { service } = recorder();
  const handler = new DeviceTokenHttpHandler(service, SECRET);
  const response = await handler.handle({
    method: 'POST',
    url: '/internal/notifications/device-tokens',
    headers: { authorization: `Bearer ${hrdToken()}` },
    body: {},
  });
  assert.equal(response.status, 400);
});

test('rejects a token signed with another secret', async () => {
  const { service } = recorder();
  const handler = new DeviceTokenHttpHandler(service, SECRET);
  const forged = jwt.sign({ sub: 'hrd-1', role: 'HRD' }, 'other-secret');
  const response = await handler.handle({
    method: 'POST',
    url: '/internal/notifications/device-tokens',
    headers: { authorization: `Bearer ${forged}` },
    body: { token: 'browser-token' },
  });
  assert.equal(response.status, 401);
});

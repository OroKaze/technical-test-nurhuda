import test from 'node:test';
import assert from 'node:assert/strict';
import { DeviceTokenService } from '../src/device-token.service';

test('registers a token for an HRD user', async () => {
  const calls: unknown[] = [];
  const service = new DeviceTokenService({
    upsert: async (userId, token) => { calls.push([userId, token]); },
    deactivate: async () => {},
  });
  await service.register('hrd-1', 'browser-token');
  assert.deepEqual(calls, [['hrd-1', 'browser-token']]);
});

test('rejects blank tokens', async () => {
  const service = new DeviceTokenService({ upsert: async () => {}, deactivate: async () => {} });
  await assert.rejects(() => service.register('hrd-1', '   '), { code: 'INVALID_DEVICE_TOKEN' });
});

test('deactivates a token for the authenticated user', async () => {
  const calls: unknown[] = [];
  const service = new DeviceTokenService({
    upsert: async () => {},
    deactivate: async (userId, token) => { calls.push([userId, token]); },
  });
  await service.remove('hrd-1', 'browser-token');
  assert.deepEqual(calls, [['hrd-1', 'browser-token']]);
});

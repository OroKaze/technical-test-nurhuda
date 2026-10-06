import test from 'node:test';
import assert from 'node:assert/strict';
import { AdminEmployeesProxyService } from '../src/admin-employees-proxy.service';

test('forwards POST /admin/employees with body and authorization', async () => {
  const seen = { url: '', method: '', auth: '', body: '' };
  const proxy = new AdminEmployeesProxyService('http://employee-service:3002', async (url, init) => {
    seen.url = String(url);
    seen.method = init?.method ?? '';
    const headers = new Headers(init?.headers);
    seen.auth = headers.get('authorization') ?? '';
    seen.body = String(init?.body ?? '');
    return new Response(JSON.stringify({ id: 'profile-1' }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  });

  const result = await proxy.forward('POST', '', 'Bearer token', { fullName: 'X' });

  assert.equal(seen.url, 'http://employee-service:3002/api/v1/admin/employees');
  assert.equal(seen.method, 'POST');
  assert.equal(seen.auth, 'Bearer token');
  assert.equal(seen.body, '{"fullName":"X"}');
  assert.deepEqual(result, { status: 201, body: { id: 'profile-1' } });
});

test('forwards GET /admin/employees/:id with path suffix', async () => {
  let seenUrl = '';
  const proxy = new AdminEmployeesProxyService('http://employee-service:3002', async (url) => {
    seenUrl = String(url);
    return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
  });

  await proxy.forward('GET', '/profile-1', 'Bearer token');
  assert.equal(seenUrl, 'http://employee-service:3002/api/v1/admin/employees/profile-1');
});

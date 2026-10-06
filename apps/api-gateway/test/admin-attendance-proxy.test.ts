import test from 'node:test';
import assert from 'node:assert/strict';
import { AdminAttendanceProxyService } from '../src/admin-attendance-proxy.service';

test('forwards admin attendance queries with auth and query string', async () => {
  const seen = { url: '', auth: '' };
  const proxy = new AdminAttendanceProxyService('http://attendance-service:3003', async (url, init) => {
    seen.url = String(url);
    seen.auth = new Headers(init?.headers).get('authorization') ?? '';
    return new Response(JSON.stringify({ data: [], meta: { page: 1, limit: 50, total: 0 } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });

  const result = await proxy.forward('Bearer token', 'from=2026-10-01&to=2026-10-05');

  assert.equal(seen.url, 'http://attendance-service:3003/api/v1/admin/attendance?from=2026-10-01&to=2026-10-05');
  assert.equal(seen.auth, 'Bearer token');
  assert.deepEqual(result, { status: 200, body: { data: [], meta: { page: 1, limit: 50, total: 0 } } });
});

test('omits trailing question mark when query string is empty', async () => {
  let seenUrl = '';
  const proxy = new AdminAttendanceProxyService('http://attendance-service:3003', async (url) => {
    seenUrl = String(url);
    return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
  });

  await proxy.forward('Bearer token', '');
  assert.equal(seenUrl, 'http://attendance-service:3003/api/v1/admin/attendance');
});

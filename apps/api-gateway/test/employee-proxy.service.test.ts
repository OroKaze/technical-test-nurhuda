import test from 'node:test';
import assert from 'node:assert/strict';
import { EmployeeProxyService } from '../src/employee-proxy.service';

test('forwards authenticated profile reads to employee service', async () => {
  let receivedAuthorization = '';
  const proxy = new EmployeeProxyService('http://employee-service:3002', async (_url, init) => {
    receivedAuthorization = new Headers(init?.headers).get('authorization') ?? '';
    return new Response(JSON.stringify({ fullName: 'Employee Name' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });

  const result = await proxy.forward('profile', 'GET', undefined, 'Bearer token');

  assert.deepEqual(result, { status: 200, body: { fullName: 'Employee Name' } });
  assert.equal(receivedAuthorization, 'Bearer token');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { UploadsProxyService } from '../src/uploads-proxy.service';

test('forwards a valid profile photo with its content type', async () => {
  let receivedUrl = '';
  const proxy = new UploadsProxyService('http://employee-service:3002', async (url) => {
    receivedUrl = String(url);
    return new Response(Buffer.from('png-bytes'), { status: 200, headers: { 'content-type': 'image/png' } });
  });

  const result = await proxy.getProfilePhoto('3f2a9c1e-0000-4000-8000-000000000001.png');

  assert.equal(receivedUrl, 'http://employee-service:3002/uploads/profile/3f2a9c1e-0000-4000-8000-000000000001.png');
  assert.equal(result.status, 200);
  assert.equal(result.contentType, 'image/png');
  assert.equal(result.body.toString(), 'png-bytes');
});

test('rejects filenames not produced by profile photo storage without calling upstream', async () => {
  let called = false;
  const proxy = new UploadsProxyService('http://employee-service:3002', async () => {
    called = true;
    return new Response(null, { status: 200 });
  });

  for (const filename of ['../secret.png', 'photo.gif', '..%2Fx.png', '']) {
    const result = await proxy.getProfilePhoto(filename);
    assert.equal(result.status, 404);
  }
  assert.equal(called, false);
});

test('maps a missing upstream file to 404', async () => {
  const proxy = new UploadsProxyService('http://employee-service:3002', async () =>
    new Response('Not Found', { status: 404 }));

  const result = await proxy.getProfilePhoto('3f2a9c1e-0000-4000-8000-000000000001.jpg');

  assert.equal(result.status, 404);
});

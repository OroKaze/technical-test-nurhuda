import test from 'node:test';
import assert from 'node:assert/strict';
import { PhotoProxyService } from '../src/photo-proxy.service';

const photo = { buffer: Buffer.from('png-bytes'), mimetype: 'image/png', originalname: 'me.png' };

test('forwards the photo as multipart with the caller authorization', async () => {
  let receivedUrl = '';
  let receivedAuthorization = '';
  let receivedPhoto!: FormDataEntryValue | null;
  const proxy = new PhotoProxyService('http://employee-service:3002', async (url, init) => {
    receivedUrl = String(url);
    receivedAuthorization = new Headers(init?.headers).get('authorization') ?? '';
    receivedPhoto = (init?.body as FormData).get('photo');
    return new Response(JSON.stringify({ photoUrl: '/uploads/profile/a.png' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });

  const result = await proxy.forward(photo, 'Bearer token');

  assert.deepEqual(result, { status: 200, body: { photoUrl: '/uploads/profile/a.png' } });
  assert.equal(receivedUrl, 'http://employee-service:3002/api/v1/me/profile/photo');
  assert.equal(receivedAuthorization, 'Bearer token');
  assert.ok(receivedPhoto instanceof Blob);
  assert.equal((receivedPhoto as Blob).type, 'image/png');
});

test('returns non-JSON upstream errors without throwing', async () => {
  const proxy = new PhotoProxyService('http://employee-service:3002', async () =>
    new Response('Payload Too Large', { status: 413, headers: { 'content-type': 'text/plain' } }));

  const result = await proxy.forward(photo, 'Bearer token');

  assert.deepEqual(result, { status: 413, body: 'Payload Too Large' });
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ProfilePhotoStorage, InvalidProfilePhotoError } from '../src/modules/employees/profile-photo.storage';

test('stores an accepted image with an opaque filename and returns a public relative URL', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dexa-photo-'));
  try {
    const storage = new ProfilePhotoStorage(root);
    const result = await storage.store({
      mimetype: 'image/png',
      originalname: '../../avatar.png',
      size: 4,
      buffer: Buffer.from('PNG!'),
    });

    assert.match(result.url, /^\/uploads\/profile\/[a-f0-9-]+\.png$/);
    assert.equal(await readFile(join(root, 'profile', result.filename), 'utf8'), 'PNG!');
    assert.equal(result.url.includes('avatar'), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('rejects unsupported MIME types', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dexa-photo-'));
  try {
    const storage = new ProfilePhotoStorage(root);
    await assert.rejects(
      () => storage.store({ mimetype: 'application/pdf', originalname: 'file.pdf', size: 3, buffer: Buffer.from('pdf') }),
      InvalidProfilePhotoError,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('rejects files larger than the configured limit', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dexa-photo-'));
  try {
    const storage = new ProfilePhotoStorage(root, 4);
    await assert.rejects(
      () => storage.store({ mimetype: 'image/jpeg', originalname: 'avatar.jpg', size: 5, buffer: Buffer.from('12345') }),
      InvalidProfilePhotoError,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

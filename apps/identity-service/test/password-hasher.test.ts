import test from 'node:test';
import assert from 'node:assert/strict';
import { Argon2PasswordHasher } from '../src/modules/auth/password-hasher';

test('hashes passwords without retaining the plaintext', async () => {
  const hasher = new Argon2PasswordHasher();
  const hash = await hasher.hash('correct-password');

  assert.notEqual(hash, 'correct-password');
  assert.match(hash, /^\$argon2id\$/);
  assert.equal(await hasher.verify(hash, 'correct-password'), true);
  assert.equal(await hasher.verify(hash, 'wrong-password'), false);
});

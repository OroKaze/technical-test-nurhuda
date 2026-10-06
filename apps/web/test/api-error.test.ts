import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, parseApiError } from '../src/lib/api-error';

test('identifies conflict errors accurately', () => {
  const err409 = new ApiError(409, 'Already checked in', 'ALREADY_CHECKED_IN');
  assert.equal(err409.isConflict, true);
  assert.equal(err409.isUnauthorized, false);
});

test('identifies unauthorized errors accurately', () => {
  const err401 = new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
  assert.equal(err401.isUnauthorized, true);
  assert.equal(err401.isConflict, false);
});

test('parseApiError handles regular Error instances', () => {
  const generic = new Error('Connection failed');
  const parsed = parseApiError(generic);
  assert.equal(parsed.statusCode, 500);
  assert.equal(parsed.message, 'Connection failed');
});

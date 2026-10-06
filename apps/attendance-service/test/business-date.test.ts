import test from 'node:test';
import assert from 'node:assert/strict';
import { toBusinessDate } from '../src/modules/attendance/business-date';

test('derives business date in Asia/Jakarta from a UTC instant', () => {
  // 2026-10-05T17:30:00Z = 2026-10-06T00:30:00 WIB (next day in Jakarta)
  const date = toBusinessDate(new Date('2026-10-05T17:30:00Z'));
  assert.equal(date, '2026-10-06');
});

test('derives business date when UTC and Jakarta are same day', () => {
  // 2026-10-05T01:00:00Z = 2026-10-05T08:00:00 WIB (same day)
  const date = toBusinessDate(new Date('2026-10-05T01:00:00Z'));
  assert.equal(date, '2026-10-05');
});

test('derives business date at midnight Jakarta boundary', () => {
  // 2026-10-04T17:00:00Z = 2026-10-05T00:00:00 WIB exactly
  const date = toBusinessDate(new Date('2026-10-04T17:00:00Z'));
  assert.equal(date, '2026-10-05');
});

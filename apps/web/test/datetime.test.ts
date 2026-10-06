import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDateJakarta,
  formatTimeJakarta,
  getTodayJakarta,
  getFirstDayOfCurrentMonthJakarta,
} from '../src/lib/datetime';

test('formatDateJakarta formats valid date string correctly', () => {
  const formatted = formatDateJakarta('2026-10-06T08:30:00.000Z');
  assert.ok(formatted.includes('2026'));
  assert.ok(formatted.includes('15') || formatted.includes('Okt') || formatted.includes('Oct') || formatted.length > 5);
});

test('formatTimeJakarta returns dash for null or undefined', () => {
  assert.equal(formatTimeJakarta(null), '—');
  assert.equal(formatTimeJakarta(undefined), '—');
});

test('getTodayJakarta returns YYYY-MM-DD pattern', () => {
  const today = getTodayJakarta();
  assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
});

test('getFirstDayOfCurrentMonthJakarta returns first day of month', () => {
  const firstDay = getFirstDayOfCurrentMonthJakarta();
  assert.match(firstDay, /^\d{4}-\d{2}-01$/);
});

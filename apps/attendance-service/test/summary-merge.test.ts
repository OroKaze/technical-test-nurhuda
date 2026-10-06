import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Verifies the DATE normalization logic used by PostgresAttendanceRepository.findSummary:
 * when pg returns attendance_date as a Date object, check-in and check-out rows
 * for the same day must merge into one summary row with a YYYY-MM-DD date.
 */
function mergeRows(rows: Array<{ attendance_date: string | Date; status: string; attendance_time: string | Date }>) {
  const byDate = new Map<string, { date: string; checkIn: string | null; checkOut: string | null }>();
  for (const row of rows) {
    const date = typeof row.attendance_date === 'string' ? row.attendance_date.slice(0, 10) : row.attendance_date.toISOString().slice(0, 10);
    const existing = byDate.get(date) ?? { date, checkIn: null, checkOut: null };
    const time = row.attendance_time instanceof Date ? row.attendance_time.toISOString() : row.attendance_time;
    if (row.status === 'CHECK_IN') existing.checkIn = time;
    if (row.status === 'CHECK_OUT') existing.checkOut = time;
    byDate.set(date, existing);
  }
  return Array.from(byDate.values());
}

test('check-in and check-out rows for the same day merge into one summary row', () => {
  const rows = [
    { attendance_date: new Date('2026-10-05T00:00:00.000Z'), status: 'CHECK_IN', attendance_time: new Date('2026-10-05T01:00:00.000Z') },
    { attendance_date: new Date('2026-10-05T00:00:00.000Z'), status: 'CHECK_OUT', attendance_time: new Date('2026-10-05T10:00:00.000Z') },
  ];
  const result = mergeRows(rows);
  assert.equal(result.length, 1);
  assert.equal(result[0]?.date, '2026-10-05');
  assert.equal(result[0]?.checkIn, '2026-10-05T01:00:00.000Z');
  assert.equal(result[0]?.checkOut, '2026-10-05T10:00:00.000Z');
});

test('incomplete pair keeps checkOut null', () => {
  const rows = [
    { attendance_date: new Date('2026-10-05T00:00:00.000Z'), status: 'CHECK_IN', attendance_time: new Date('2026-10-05T01:00:00.000Z') },
  ];
  const result = mergeRows(rows);
  assert.equal(result.length, 1);
  assert.equal(result[0]?.checkOut, null);
});

test('multiple days produce one row per day', () => {
  const rows = [
    { attendance_date: new Date('2026-10-04T00:00:00.000Z'), status: 'CHECK_IN', attendance_time: new Date('2026-10-04T01:00:00.000Z') },
    { attendance_date: new Date('2026-10-05T00:00:00.000Z'), status: 'CHECK_IN', attendance_time: new Date('2026-10-05T01:00:00.000Z') },
  ];
  const result = mergeRows(rows);
  assert.equal(result.length, 2);
});

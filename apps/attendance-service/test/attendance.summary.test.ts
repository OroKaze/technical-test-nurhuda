import test from 'node:test';
import assert from 'node:assert/strict';
import { AttendanceService } from '../src/modules/attendance/attendance.service';
import type { AttendanceRepository } from '../src/modules/attendance/attendance.types';

function createRepo(captured: { from?: string; to?: string }): AttendanceRepository {
  return {
    findByEmployeeAndDate: async () => [],
    insert: async (record) => ({
      id: 'a',
      employeeId: record.employeeId,
      attendanceDate: record.attendanceDate,
      attendanceTime: record.attendanceTime.toISOString(),
      status: record.status,
    }),
    findSummary: async (_employeeId, from, to) => {
      captured.from = from;
      captured.to = to;
      return [{ date: from, checkIn: '2026-10-01T01:00:00.000Z', checkOut: null }];
    },
  };
}

test('default summary covers first day of current business month through today', async () => {
  const captured: { from?: string; to?: string } = {};
  const service = new AttendanceService(createRepo(captured));
  // 2026-10-05T01:00:00Z = 2026-10-05T08:00:00 WIB
  await service.summary('emp-1', undefined, undefined, new Date('2026-10-05T01:00:00Z'));
  assert.equal(captured.from, '2026-10-01');
  assert.equal(captured.to, '2026-10-05');
});

test('explicit date range is passed through inclusively', async () => {
  const captured: { from?: string; to?: string } = {};
  const service = new AttendanceService(createRepo(captured));
  await service.summary('emp-1', '2026-10-01', '2026-10-05', new Date('2026-10-05T01:00:00Z'));
  assert.equal(captured.from, '2026-10-01');
  assert.equal(captured.to, '2026-10-05');
});

test('from after to throws INVALID_DATE_RANGE', async () => {
  const service = new AttendanceService(createRepo({}));
  await assert.rejects(
    () => service.summary('emp-1', '2026-10-05', '2026-10-01', new Date('2026-10-05T01:00:00Z')),
    { code: 'INVALID_DATE_RANGE' },
  );
});

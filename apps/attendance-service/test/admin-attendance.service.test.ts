import test from 'node:test';
import assert from 'node:assert/strict';
import { AdminAttendanceService } from '../src/modules/attendance/admin-attendance.service';
import type { AdminAttendanceRepository, AdminAttendanceQuery } from '../src/modules/attendance/admin-attendance.types';

function createRepo(captured: { params?: AdminAttendanceQuery }) {
  const repository: AdminAttendanceRepository = {
    findAll: async (params) => {
      captured.params = params;
      return {
        rows: [
          {
            id: 'r1',
            employeeId: 'emp-1',
            attendanceDate: '2026-10-05',
            attendanceTime: '2026-10-05T01:00:00.000Z',
            status: 'CHECK_IN' as const,
          },
        ],
        total: 1,
      };
    },
  };
  return repository;
}

test('defaults monitoring range to current business month through today', async () => {
  const captured: { params?: AdminAttendanceQuery } = {};
  const service = new AdminAttendanceService(createRepo(captured));
  await service.monitor({}, new Date('2026-10-05T01:00:00Z'));
  assert.equal(captured.params?.from, '2026-10-01');
  assert.equal(captured.params?.to, '2026-10-05');
  assert.equal(captured.params?.page, 1);
  assert.equal(captured.params?.limit, 50);
});

test('passes explicit range, employee filter, and pagination through', async () => {
  const captured: { params?: AdminAttendanceQuery } = {};
  const service = new AdminAttendanceService(createRepo(captured));
  await service.monitor(
    { from: '2026-10-01', to: '2026-10-05', employeeId: 'emp-1', page: 2, limit: 10 },
    new Date('2026-10-05T01:00:00Z'),
  );
  assert.equal(captured.params?.from, '2026-10-01');
  assert.equal(captured.params?.to, '2026-10-05');
  assert.equal(captured.params?.employeeId, 'emp-1');
  assert.equal(captured.params?.page, 2);
  assert.equal(captured.params?.limit, 10);
});

test('caps limit at 200', async () => {
  const captured: { params?: AdminAttendanceQuery } = {};
  const service = new AdminAttendanceService(createRepo(captured));
  await service.monitor({ limit: 500 }, new Date('2026-10-05T01:00:00Z'));
  assert.equal(captured.params?.limit, 200);
});

test('from after to throws INVALID_DATE_RANGE', async () => {
  const service = new AdminAttendanceService(createRepo({}));
  await assert.rejects(
    () => service.monitor({ from: '2026-10-05', to: '2026-10-01' }, new Date('2026-10-05T01:00:00Z')),
    { code: 'INVALID_DATE_RANGE' },
  );
});

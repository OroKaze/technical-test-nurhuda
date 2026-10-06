import test from 'node:test';
import assert from 'node:assert/strict';
import { AttendanceService } from '../src/modules/attendance/attendance.service';
import type { AttendanceRepository } from '../src/modules/attendance/attendance.types';

function createRepo(records: Array<{ employee_id: string; attendance_date: string; status: string }> = []): AttendanceRepository {
  return {
    findByEmployeeAndDate: async (employeeId, date) =>
      records.filter(r => r.employee_id === employeeId && r.attendance_date === date),
    insert: async (record) => record,
    findSummary: async () => [],
  };
}

test('check-in succeeds when no existing check-in for the business date', async () => {
  const service = new AttendanceService(createRepo());
  const result = await service.checkIn('emp-1', new Date('2026-10-05T01:00:00Z'));
  assert.equal(result.employeeId, 'emp-1');
  assert.equal(result.status, 'CHECK_IN');
});

test('duplicate check-in throws 409 conflict', async () => {
  const repo = createRepo([
    { employee_id: 'emp-1', attendance_date: '2026-10-05', status: 'CHECK_IN' },
  ]);
  const service = new AttendanceService(repo);
  await assert.rejects(
    () => service.checkIn('emp-1', new Date('2026-10-05T02:00:00Z')),
    { code: 'ATTENDANCE_ALREADY_CHECKED_IN' },
  );
});

test('check-out succeeds when check-in exists and no check-out yet', async () => {
  const repo = createRepo([
    { employee_id: 'emp-1', attendance_date: '2026-10-05', status: 'CHECK_IN' },
  ]);
  const service = new AttendanceService(repo);
  const result = await service.checkOut('emp-1', new Date('2026-10-05T10:00:00Z'));
  assert.equal(result.status, 'CHECK_OUT');
});

test('check-out without check-in throws conflict', async () => {
  const service = new AttendanceService(createRepo());
  await assert.rejects(
    () => service.checkOut('emp-1', new Date('2026-10-05T10:00:00Z')),
    { code: 'CHECK_IN_REQUIRED' },
  );
});

test('duplicate check-out throws conflict', async () => {
  const repo = createRepo([
    { employee_id: 'emp-1', attendance_date: '2026-10-05', status: 'CHECK_IN' },
    { employee_id: 'emp-1', attendance_date: '2026-10-05', status: 'CHECK_OUT' },
  ]);
  const service = new AttendanceService(repo);
  await assert.rejects(
    () => service.checkOut('emp-1', new Date('2026-10-05T11:00:00Z')),
    { code: 'ATTENDANCE_ALREADY_CHECKED_OUT' },
  );
});

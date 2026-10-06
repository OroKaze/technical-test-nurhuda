import test from 'node:test';
import assert from 'node:assert/strict';
import { AttendanceService } from '../src/modules/attendance/attendance.service';
import type { AttendanceRepository } from '../src/modules/attendance/attendance.types';

function repo() : AttendanceRepository {
  return {
    findByEmployeeAndDate: async () => [],
    insert: async (record) => ({
      id: 'attendance-1', employeeId: record.employeeId,
      attendanceDate: record.attendanceDate,
      attendanceTime: record.attendanceTime.toISOString(), status: record.status,
    }),
    findSummary: async () => [],
  };
}

test('check-in emits an attendance.checked.in event', async () => {
  const events: unknown[] = [];
  const service = new AttendanceService(repo(), {
    insert: async (event) => { events.push(event); },
  });
  await service.checkIn('employee-1', new Date('2026-10-05T01:00:00Z'), 'corr-1');
  assert.equal(events.length, 1);
  assert.equal((events[0] as { eventType: string }).eventType, 'attendance.checked.in');
});

test('check-out emits an attendance.checked.out event', async () => {
  const events: unknown[] = [];
  const repository = repo();
  repository.findByEmployeeAndDate = async () => [
    { employee_id: 'employee-1', attendance_date: '2026-10-05', status: 'CHECK_IN' },
  ];
  const service = new AttendanceService(repository, {
    insert: async (event) => { events.push(event); },
  });
  await service.checkOut('employee-1', new Date('2026-10-05T10:00:00Z'), 'corr-2');
  assert.equal((events[0] as { eventType: string }).eventType, 'attendance.checked.out');
});

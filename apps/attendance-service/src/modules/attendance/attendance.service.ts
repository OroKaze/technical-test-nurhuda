import crypto from 'node:crypto';
import { toBusinessDate, firstDayOfBusinessMonth } from './business-date';
import type { AttendanceOutboxRepository } from '../events/attendance-outbox.types';
import {
  AttendanceAlreadyCheckedInError,
  AttendanceAlreadyCheckedOutError,
  CheckInRequiredError,
  InvalidDateRangeError,
  type AttendanceRecord,
  type AttendanceRepository,
  type SummaryRow,
} from './attendance.types';

export class AttendanceService {
  constructor(
    private readonly repository: AttendanceRepository,
    private readonly outbox?: AttendanceOutboxRepository,
  ) {}

  async checkIn(employeeId: string, instant: Date): Promise<AttendanceRecord> {
    const businessDate = toBusinessDate(instant);
    const existing = await this.repository.findByEmployeeAndDate(employeeId, businessDate);

    if (existing.some((r) => r.status === 'CHECK_IN')) {
      throw new AttendanceAlreadyCheckedInError();
    }

    const record = await this.repository.insert({
      employeeId,
      attendanceDate: businessDate,
      attendanceTime: instant,
      status: 'CHECK_IN',
    });
    await this.outbox?.insert({
      eventType: 'attendance.checked.in', aggregateId: record.id, employeeId,
      attendanceDate: businessDate, attendanceTime: instant, actorId: employeeId,
      correlationId: crypto.randomUUID(),
    });
    return record;
  }

  async checkOut(employeeId: string, instant: Date): Promise<AttendanceRecord> {
    const businessDate = toBusinessDate(instant);
    const existing = await this.repository.findByEmployeeAndDate(employeeId, businessDate);

    if (!existing.some((r) => r.status === 'CHECK_IN')) {
      throw new CheckInRequiredError();
    }

    if (existing.some((r) => r.status === 'CHECK_OUT')) {
      throw new AttendanceAlreadyCheckedOutError();
    }

    const record = await this.repository.insert({
      employeeId,
      attendanceDate: businessDate,
      attendanceTime: instant,
      status: 'CHECK_OUT',
    });
    await this.outbox?.insert({
      eventType: 'attendance.checked.out', aggregateId: record.id, employeeId,
      attendanceDate: businessDate, attendanceTime: instant, actorId: employeeId,
      correlationId: crypto.randomUUID(),
    });
    return record;
  }

  async summary(employeeId: string, from?: string, to?: string, now: Date = new Date()): Promise<SummaryRow[]> {
    const resolvedFrom = from ?? firstDayOfBusinessMonth(now);
    const resolvedTo = to ?? toBusinessDate(now);

    if (resolvedFrom > resolvedTo) {
      throw new InvalidDateRangeError();
    }

    return this.repository.findSummary(employeeId, resolvedFrom, resolvedTo);
  }
}

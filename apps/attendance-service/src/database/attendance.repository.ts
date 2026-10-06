import { Pool } from 'pg';
import type {
  AttendanceRecord,
  AttendanceRepository,
  InsertAttendanceParams,
  SummaryRow,
} from '../modules/attendance/attendance.types';

type AttendanceRow = {
  id: string;
  employee_id: string;
  attendance_date: string;
  attendance_time: string;
  status: string;
};

export class PostgresAttendanceRepository implements AttendanceRepository {
  constructor(private readonly pool: Pool) {}

  async findByEmployeeAndDate(employeeId: string, attendanceDate: string) {
    const result = await this.pool.query<Pick<AttendanceRow, 'employee_id' | 'attendance_date' | 'status'>>(
      `SELECT employee_id, attendance_date, status
       FROM attendance_records
       WHERE employee_id = $1 AND attendance_date = $2`,
      [employeeId, attendanceDate],
    );
    return result.rows;
  }

  async insert(record: InsertAttendanceParams): Promise<AttendanceRecord> {
    const result = await this.pool.query<AttendanceRow>(
      `INSERT INTO attendance_records (employee_id, attendance_date, attendance_time, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, employee_id, attendance_date, attendance_time, status`,
      [record.employeeId, record.attendanceDate, record.attendanceTime.toISOString(), record.status],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Attendance insert returned no row');
    return {
      id: row.id,
      employeeId: row.employee_id,
      attendanceDate: row.attendance_date,
      attendanceTime: row.attendance_time,
      status: row.status as AttendanceRecord['status'],
    };
  }

  async findSummary(employeeId: string, from: string, to: string): Promise<SummaryRow[]> {
    const result = await this.pool.query<{ attendance_date: string | Date; status: string; attendance_time: string | Date }>(
      `SELECT attendance_date, status, attendance_time
       FROM attendance_records
       WHERE employee_id = $1 AND attendance_date >= $2 AND attendance_date <= $3
       ORDER BY attendance_date`,
      [employeeId, from, to],
    );

    const byDate = new Map<string, SummaryRow>();
    for (const row of result.rows) {
      const date = toDateKey(row.attendance_date);
      const existing = byDate.get(date) ?? { date, checkIn: null, checkOut: null };
      const time = row.attendance_time instanceof Date ? row.attendance_time.toISOString() : row.attendance_time;
      if (row.status === 'CHECK_IN') existing.checkIn = time;
      if (row.status === 'CHECK_OUT') existing.checkOut = time;
      byDate.set(date, existing);
    }
    return Array.from(byDate.values());
  }
}

/**
 * Normalizes a PostgreSQL DATE value (returned as JS Date by pg) to a YYYY-MM-DD string.
 */
function toDateKey(value: string | Date): string {
  if (typeof value === 'string') return value.slice(0, 10);
  // pg parses DATE as a Date at midnight UTC
  return value.toISOString().slice(0, 10);
}

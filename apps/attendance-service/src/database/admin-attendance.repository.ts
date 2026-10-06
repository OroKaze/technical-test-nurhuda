import { Pool } from 'pg';
import type {
  AdminAttendanceQuery,
  AdminAttendanceRepository,
  AdminAttendanceRow,
} from '../modules/attendance/admin-attendance.types';

type AdminRow = {
  id: string;
  employee_id: string;
  attendance_date: string | Date;
  attendance_time: string | Date;
  status: string;
};

export class PostgresAdminAttendanceRepository implements AdminAttendanceRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(params: AdminAttendanceQuery): Promise<{ rows: AdminAttendanceRow[]; total: number }> {
    const offset = (params.page - 1) * params.limit;
    const conditions = ['attendance_date >= $1', 'attendance_date <= $2'];
    const values: unknown[] = [params.from, params.to];

    if (params.employeeId) {
      values.push(params.employeeId);
      conditions.push(`employee_id = $${values.length}`);
    }

    values.push(params.limit, offset);
    const limitIndex = values.length - 1;
    const offsetIndex = values.length;

    const [countResult, dataResult] = await Promise.all([
      this.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM attendance_records WHERE ${conditions.join(' AND ')}`,
        values.slice(0, values.length - 2),
      ),
      this.pool.query<AdminRow>(
        `SELECT id, employee_id, attendance_date, attendance_time, status
         FROM attendance_records
         WHERE ${conditions.join(' AND ')}
         ORDER BY attendance_date DESC, attendance_time DESC
         LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
        values,
      ),
    ]);

    return {
      rows: dataResult.rows.map((row) => ({
        id: row.id,
        employeeId: row.employee_id,
        attendanceDate: toDateKey(row.attendance_date),
        attendanceTime: row.attendance_time instanceof Date ? row.attendance_time.toISOString() : row.attendance_time,
        status: row.status as AdminAttendanceRow['status'],
      })),
      total: Number(countResult.rows[0]?.count ?? 0),
    };
  }
}

function toDateKey(value: string | Date): string {
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

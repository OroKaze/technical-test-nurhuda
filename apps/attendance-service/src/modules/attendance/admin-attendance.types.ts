import type { AttendanceStatus } from './attendance.types';

export interface AdminAttendanceQuery {
  from: string;
  to: string;
  employeeId?: string;
  page: number;
  limit: number;
}

export interface AdminAttendanceRow {
  id: string;
  employeeId: string;
  attendanceDate: string;
  attendanceTime: string;
  status: AttendanceStatus;
}

export interface AdminAttendanceResult {
  data: AdminAttendanceRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface AdminAttendanceRepository {
  findAll(params: AdminAttendanceQuery): Promise<{ rows: AdminAttendanceRow[]; total: number }>;
}

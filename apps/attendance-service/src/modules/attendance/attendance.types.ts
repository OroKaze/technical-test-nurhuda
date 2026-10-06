export type AttendanceStatus = 'CHECK_IN' | 'CHECK_OUT';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  attendanceDate: string;
  attendanceTime: string;
  status: AttendanceStatus;
}

export interface InsertAttendanceParams {
  employeeId: string;
  attendanceDate: string;
  attendanceTime: Date;
  status: AttendanceStatus;
}

export interface SummaryRow {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
}

export interface AttendanceRepository {
  findByEmployeeAndDate(employeeId: string, attendanceDate: string): Promise<Array<{ employee_id: string; attendance_date: string; status: string }>>;
  insert(record: InsertAttendanceParams): Promise<AttendanceRecord>;
  findSummary(employeeId: string, from: string, to: string): Promise<SummaryRow[]>;
}

export class AttendanceAlreadyCheckedInError extends Error {
  readonly code = 'ATTENDANCE_ALREADY_CHECKED_IN';
  constructor() {
    super('A check-in already exists for this business date.');
  }
}

export class AttendanceAlreadyCheckedOutError extends Error {
  readonly code = 'ATTENDANCE_ALREADY_CHECKED_OUT';
  constructor() {
    super('A check-out already exists for this business date.');
  }
}

export class CheckInRequiredError extends Error {
  readonly code = 'CHECK_IN_REQUIRED';
  constructor() {
    super('A check-in is required before checking out.');
  }
}

export class InvalidDateRangeError extends Error {
  readonly code = 'INVALID_DATE_RANGE';
  constructor() {
    super('The from date must be on or before the to date.');
  }
}

import { firstDayOfBusinessMonth, toBusinessDate } from './business-date';
import { InvalidDateRangeError } from './attendance.types';
import type { AdminAttendanceQuery, AdminAttendanceRepository, AdminAttendanceResult } from './admin-attendance.types';

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

export interface AdminAttendanceFilter {
  from?: string;
  to?: string;
  employeeId?: string;
  page?: number;
  limit?: number;
}

export class AdminAttendanceService {
  constructor(private readonly repository: AdminAttendanceRepository) {}

  async monitor(filter: AdminAttendanceFilter, now: Date): Promise<AdminAttendanceResult> {
    const from = filter.from ?? firstDayOfBusinessMonth(now);
    const to = filter.to ?? toBusinessDate(now);

    if (from > to) {
      throw new InvalidDateRangeError();
    }

    const query: AdminAttendanceQuery = {
      from,
      to,
      employeeId: filter.employeeId,
      page: Math.max(1, filter.page ?? 1),
      limit: Math.min(Math.max(filter.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT),
    };

    const { rows, total } = await this.repository.findAll(query);

    return {
      data: rows,
      meta: { page: query.page, limit: query.limit, total },
    };
  }
}

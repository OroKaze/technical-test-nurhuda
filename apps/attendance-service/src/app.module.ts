import { Module } from '@nestjs/common';
import { Pool } from 'pg';
import { AttendanceController } from './modules/attendance/attendance.controller';
import { AttendanceService } from './modules/attendance/attendance.service';
import { AdminAttendanceController } from './modules/attendance/admin-attendance.controller';
import { AdminAttendanceService } from './modules/attendance/admin-attendance.service';
import { PostgresAttendanceRepository } from './database/attendance.repository';
import { PostgresAdminAttendanceRepository } from './database/admin-attendance.repository';
import { AccessTokenGuard } from './modules/auth/access-token.guard';
import { HrdGuard } from './modules/auth/hrd.guard';
import { HealthController } from './health.controller';
import { PostgresAttendanceOutboxRepository } from './modules/events/postgres-attendance-outbox.repository';
import { AttendanceOutboxRepository } from './modules/events/attendance-outbox.types';

const attendanceOutboxToken = 'ATTENDANCE_OUTBOX_REPOSITORY';
export { attendanceOutboxToken };

@Module({
  controllers: [AttendanceController, AdminAttendanceController, HealthController],
  providers: [
    {
      provide: Pool,
      useFactory: () => new Pool({ connectionString: process.env.ATTENDANCE_DATABASE_URL }),
    },
    {
      provide: PostgresAttendanceRepository,
      useFactory: (pool: Pool) => new PostgresAttendanceRepository(pool),
      inject: [Pool],
    },
    {
      provide: attendanceOutboxToken,
      useFactory: (pool: Pool) => new PostgresAttendanceOutboxRepository(pool),
      inject: [Pool],
    },
    {
      provide: PostgresAdminAttendanceRepository,
      useFactory: (pool: Pool) => new PostgresAdminAttendanceRepository(pool),
      inject: [Pool],
    },
    {
      provide: AttendanceService,
      useFactory: (
        repository: PostgresAttendanceRepository,
        outbox: PostgresAttendanceOutboxRepository,
      ) => new AttendanceService(repository, outbox),
      inject: [PostgresAttendanceRepository, attendanceOutboxToken],
    },
    {
      provide: AdminAttendanceService,
      useFactory: (repository: PostgresAdminAttendanceRepository) => new AdminAttendanceService(repository),
      inject: [PostgresAdminAttendanceRepository],
    },
    AccessTokenGuard,
    HrdGuard,
  ],
})
export class AppModule {}

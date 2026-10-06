import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthProxyService } from './auth-proxy.service';
import { EmployeeProxyService } from './employee-proxy.service';
import { EmployeeController } from './employee.controller';
import { AttendanceProxyService } from './attendance-proxy.service';
import { AttendanceController } from './attendance.controller';
import { AdminAttendanceProxyService } from './admin-attendance-proxy.service';
import { AdminAttendanceController } from './admin-attendance.controller';
import { AdminEmployeesProxyService } from './admin-employees-proxy.service';
import { AdminEmployeesController } from './admin-employees.controller';
import { PhotoProxyService } from './photo-proxy.service';
import { PhotoController } from './photo.controller';
import { HealthController } from './health.controller';
import { DeviceTokenProxyService } from './device-token-proxy.service';
import { DeviceTokenController } from './device-token.controller';
import { UploadsProxyService } from './uploads-proxy.service';
import { UploadsController } from './uploads.controller';

@Module({
  controllers: [AuthController, EmployeeController, AttendanceController, AdminAttendanceController, AdminEmployeesController, PhotoController, UploadsController, DeviceTokenController, HealthController],
  providers: [
    {
      provide: AuthProxyService,
      useFactory: () => new AuthProxyService(
        process.env.IDENTITY_SERVICE_URL ?? 'http://identity-service:3001',
      ),
    },
    {
      provide: EmployeeProxyService,
      useFactory: () => new EmployeeProxyService(
        process.env.EMPLOYEE_SERVICE_URL ?? 'http://employee-service:3002',
      ),
    },
    {
      provide: AttendanceProxyService,
      useFactory: () => new AttendanceProxyService(
        process.env.ATTENDANCE_SERVICE_URL ?? 'http://attendance-service:3003',
      ),
    },
    {
      provide: AdminAttendanceProxyService,
      useFactory: () => new AdminAttendanceProxyService(
        process.env.ATTENDANCE_SERVICE_URL ?? 'http://attendance-service:3003',
      ),
    },
    {
      provide: AdminEmployeesProxyService,
      useFactory: () => new AdminEmployeesProxyService(
        process.env.EMPLOYEE_SERVICE_URL ?? 'http://employee-service:3002',
      ),
    },
    {
      provide: PhotoProxyService,
      useFactory: () => new PhotoProxyService(
        process.env.EMPLOYEE_SERVICE_URL ?? 'http://employee-service:3002',
      ),
    },
    {
      provide: UploadsProxyService,
      useFactory: () => new UploadsProxyService(
        process.env.EMPLOYEE_SERVICE_URL ?? 'http://employee-service:3002',
      ),
    },
    {
      provide: DeviceTokenProxyService,
      useFactory: () => new DeviceTokenProxyService(
        process.env.EVENT_WORKER_URL ?? 'http://event-worker:3004',
      ),
    },
  ],
})
export class AppModule {}

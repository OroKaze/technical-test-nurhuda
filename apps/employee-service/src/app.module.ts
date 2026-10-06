import { Module } from '@nestjs/common';
import { Pool } from 'pg';
import { EmployeeController } from './modules/employees/employee.controller';
import { AdminEmployeeController } from './modules/employees/admin-employee.controller';
import { EmployeeProfileService } from './modules/employees/employee-profile.service';
import { EmployeeManagementService } from './modules/employees/admin-employee.service';
import { HttpIdentityAccountClient } from './modules/employees/admin-employee.identity-client';
import { PostgresEmployeeProfileRepository } from './database/profile.repository';
import { PostgresAdminEmployeeRepository } from './database/admin-employee.repository';
import { AccessTokenGuard } from './modules/auth/access-token.guard';
import { HrdGuard } from './modules/auth/hrd.guard';
import { PostgresOutboxRepository } from './modules/events/outbox.repository';
import { HealthController } from './health.controller';
import { ProfilePhotoStorage } from './modules/employees/profile-photo.storage';

const outboxRepositoryToken = 'OUTBOX_REPOSITORY';
const profilePhotoStorageToken = 'PROFILE_PHOTO_STORAGE';
const identityAccountClientToken = 'IDENTITY_ACCOUNT_CLIENT';

export { outboxRepositoryToken, profilePhotoStorageToken };

@Module({
  controllers: [EmployeeController, AdminEmployeeController, HealthController],
  providers: [
    {
      provide: Pool,
      useFactory: () => new Pool({ connectionString: process.env.EMPLOYEE_DATABASE_URL }),
    },
    {
      provide: PostgresEmployeeProfileRepository,
      useFactory: (pool: Pool) => new PostgresEmployeeProfileRepository(pool),
      inject: [Pool],
    },
    {
      provide: PostgresAdminEmployeeRepository,
      useFactory: (pool: Pool) => new PostgresAdminEmployeeRepository(pool),
      inject: [Pool],
    },
    {
      provide: outboxRepositoryToken,
      useFactory: (pool: Pool) => new PostgresOutboxRepository(pool),
      inject: [Pool],
    },
    {
      provide: profilePhotoStorageToken,
      useFactory: () => new ProfilePhotoStorage(process.env.UPLOADS_DIRECTORY ?? '/app/uploads'),
    },
    {
      provide: ProfilePhotoStorage,
      useExisting: profilePhotoStorageToken,
    },
    {
      provide: EmployeeProfileService,
      useFactory: (
        repository: PostgresEmployeeProfileRepository,
        outbox: PostgresOutboxRepository,
      ) => new EmployeeProfileService(repository, outbox),
      inject: [PostgresEmployeeProfileRepository, outboxRepositoryToken],
    },
    {
      provide: EmployeeController,
      useFactory: (
        profiles: EmployeeProfileService,
        photos: ProfilePhotoStorage,
      ) => new EmployeeController(profiles, photos),
      inject: [EmployeeProfileService, profilePhotoStorageToken],
    },
    {
      provide: identityAccountClientToken,
      useFactory: () => new HttpIdentityAccountClient(
        process.env.IDENTITY_SERVICE_URL ?? 'http://identity-service:3001',
      ),
    },
    {
      provide: EmployeeManagementService,
      useFactory: (
        repository: PostgresAdminEmployeeRepository,
        identity: HttpIdentityAccountClient,
      ) => new EmployeeManagementService(
        repository,
        identity,
        process.env.COMPANY_EMAIL_DOMAIN ?? 'company.example',
      ),
      inject: [PostgresAdminEmployeeRepository, identityAccountClientToken],
    },
    AccessTokenGuard,
    HrdGuard,
  ],
})
export class AppModule {}

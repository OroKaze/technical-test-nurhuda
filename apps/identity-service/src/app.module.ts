import { Module } from '@nestjs/common';
import { Pool } from 'pg';
import { AuthController } from './modules/auth/auth.controller';
import { InternalUsersController } from './modules/auth/internal-users.controller';
import { AuthService } from './modules/auth/auth.service';
import { Argon2PasswordHasher } from './modules/auth/password-hasher';
import { JwtAccessTokenService } from './modules/auth/jwt-token';
import { AccessTokenGuard } from './modules/auth/access-token.guard';
import { PostgresUserRepository } from './database/user.repository';
import { HealthController } from './health.controller';

@Module({
  controllers: [AuthController, InternalUsersController, HealthController],
  providers: [
    {
      provide: Pool,
      useFactory: () => new Pool({ connectionString: process.env.IDENTITY_DATABASE_URL }),
    },
    {
      provide: PostgresUserRepository,
      useFactory: (pool: Pool) => new PostgresUserRepository(pool),
      inject: [Pool],
    },
    {
      provide: Argon2PasswordHasher,
      useFactory: () => new Argon2PasswordHasher(),
    },
    {
      provide: JwtAccessTokenService,
      useFactory: () => new JwtAccessTokenService(
        requireEnvironment('JWT_SECRET'),
        process.env.JWT_EXPIRES_IN ?? '15m',
      ),
    },
    AccessTokenGuard,
    {
      provide: AuthService,
      useFactory: (
        users: PostgresUserRepository,
        passwords: Argon2PasswordHasher,
        tokens: JwtAccessTokenService,
      ) => new AuthService(
        users,
        passwords,
        tokens,
        requireEnvironment('COMPANY_EMAIL_DOMAIN'),
      ),
      inject: [PostgresUserRepository, Argon2PasswordHasher, JwtAccessTokenService],
    },
  ],
})
export class AppModule {}

function requireEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

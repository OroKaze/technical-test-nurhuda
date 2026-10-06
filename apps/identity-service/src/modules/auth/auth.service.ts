import type { PublicUser, UserRepository } from './auth.types';
import {
  CurrentPasswordError,
  EmailAlreadyExistsError,
  InactiveAccountError,
  InvalidCompanyEmailError,
  InvalidCredentialsError,
  UserNotFoundError,
} from './auth.types';
import type { UserRole } from '@dexa/contracts';
import type { AccessTokenService } from './jwt-token';
import type { PasswordHasher } from './password-hasher';
import { isCompanyEmail } from './company-email';

export interface LoginResult {
  accessToken: string;
  user: PublicUser;
}

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly passwords: PasswordHasher,
    private readonly tokens: AccessTokenService,
    private readonly companyDomain: string,
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.users.findByCompanyEmail(normalizedEmail);

    if (!user || !isCompanyEmail(normalizedEmail, this.companyDomain)) {
      throw new InvalidCredentialsError();
    }

    if (!user.isActive) {
      throw new InactiveAccountError();
    }

    const validPassword = await this.passwords.verify(user.passwordHash, password);
    if (!validPassword) {
      throw new InvalidCredentialsError();
    }

    const publicUser = toPublicUser(user);
    return {
      accessToken: this.tokens.sign({ sub: user.id, email: user.companyEmail, role: user.role }),
      user: publicUser,
    };
  }

  async createUser(email: string, password: string, role: UserRole): Promise<PublicUser> {
    const companyEmail = email.trim().toLowerCase();
    if (!isCompanyEmail(companyEmail, this.companyDomain)) {
      throw new InvalidCompanyEmailError();
    }

    const existingUser = await this.users.findByCompanyEmail(companyEmail);
    if (existingUser) {
      throw new EmailAlreadyExistsError();
    }

    const passwordHash = await this.passwords.hash(password);
    const createdUser = await this.users.create({ companyEmail, passwordHash, role });
    return toPublicUser(createdUser);
  }

  async getCurrentUser(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);
    if (!user || !user.isActive) {
      throw new UserNotFoundError();
    }

    return toPublicUser(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user || !user.isActive) {
      throw new UserNotFoundError();
    }

    const validCurrentPassword = await this.passwords.verify(user.passwordHash, currentPassword);
    if (!validCurrentPassword) {
      throw new CurrentPasswordError();
    }

    const newPasswordHash = await this.passwords.hash(newPassword);
    await this.users.updatePasswordHash(user.id, newPasswordHash);
  }
}

function toPublicUser(user: { id: string; companyEmail: string; role: PublicUser['role'] }): PublicUser {
  return { id: user.id, email: user.companyEmail, role: user.role };
}

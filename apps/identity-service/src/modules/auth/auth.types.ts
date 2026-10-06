import type { UserRole } from '@dexa/contracts';

export interface UserAccount {
  id: string;
  companyEmail: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
}

export interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface CreateUserParams {
  companyEmail: string;
  passwordHash: string;
  role: UserRole;
}

export interface UserRepository {
  findByCompanyEmail(companyEmail: string): Promise<UserAccount | null>;
  findById(id: string): Promise<UserAccount | null>;
  updatePasswordHash(id: string, passwordHash: string): Promise<void>;
  create(params: CreateUserParams): Promise<UserAccount>;
}

export class InvalidCredentialsError extends Error {
  readonly code = 'INVALID_CREDENTIALS';

  constructor() {
    super('The email or password is invalid.');
  }
}

export class InactiveAccountError extends Error {
  readonly code = 'ACCOUNT_INACTIVE';

  constructor() {
    super('The account is inactive.');
  }
}

export class CurrentPasswordError extends Error {
  readonly code = 'CURRENT_PASSWORD_INVALID';

  constructor() {
    super('The current password is invalid.');
  }
}

export class UserNotFoundError extends Error {
  readonly code = 'USER_NOT_FOUND';

  constructor() {
    super('The user was not found.');
  }
}

export class InvalidCompanyEmailError extends Error {
  readonly code = 'INVALID_COMPANY_EMAIL';

  constructor() {
    super('The email must use the configured company domain.');
  }
}

export class EmailAlreadyExistsError extends Error {
  readonly code = 'EMAIL_ALREADY_EXISTS';

  constructor() {
    super('The company email is already registered.');
  }
}

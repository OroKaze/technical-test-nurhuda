import type { EmployeeProfile } from './employee-profile.types';

export interface AdminEmployeeListQuery {
  page: number;
  limit: number;
}

export interface AdminEmployeeListResult {
  data: EmployeeProfile[];
  meta: { page: number; limit: number; total: number };
}

export interface CreateEmployeeParams {
  fullName: string;
  companyEmail: string;
  password: string;
  position: string;
  phoneNumber?: string;
}

export interface UpdateEmployeeParams {
  fullName?: string;
  position?: string;
  phoneNumber?: string | null;
}

export interface AdminEmployeeRepository {
  findAll(query: AdminEmployeeListQuery): Promise<{ rows: EmployeeProfile[]; total: number }>;
  findById(id: string): Promise<EmployeeProfile | null>;
  findByCompanyEmail(email: string): Promise<EmployeeProfile | null>;
  create(params: {
    userId: string;
    fullName: string;
    companyEmail: string;
    position: string;
    phoneNumber?: string;
  }): Promise<EmployeeProfile>;
  update(id: string, changes: UpdateEmployeeParams): Promise<EmployeeProfile>;
}

export interface IdentityAccountClient {
  createAccount(email: string, password: string): Promise<{ id: string }>;
}

export class EmployeeEmailExistsError extends Error {
  readonly code = 'EMPLOYEE_EMAIL_EXISTS';
  constructor() { super('An employee with this email already exists.'); }
}

export class EmployeeInvalidCompanyEmailError extends Error {
  readonly code = 'INVALID_COMPANY_EMAIL';
  constructor() { super('The email must use the configured company domain.'); }
}

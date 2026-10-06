import { isCompanyEmail } from '../../identity-email';
import {
  EmployeeEmailExistsError,
  EmployeeInvalidCompanyEmailError,
  type AdminEmployeeListQuery,
  type AdminEmployeeListResult,
  type AdminEmployeeRepository,
  type CreateEmployeeParams,
  type IdentityAccountClient,
  type UpdateEmployeeParams,
} from './admin-employee.types';
import { EmployeeProfileNotFoundError } from './employee-profile.types';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export class EmployeeManagementService {
  constructor(
    private readonly repository: AdminEmployeeRepository,
    private readonly identity: IdentityAccountClient,
    private readonly companyDomain: string,
  ) {}

  async createEmployee(params: CreateEmployeeParams) {
    const email = params.companyEmail.trim().toLowerCase();
    if (!isCompanyEmail(email, this.companyDomain)) {
      throw new EmployeeInvalidCompanyEmailError();
    }

    const existingProfile = await this.repository.findByCompanyEmail(email);
    if (existingProfile) throw new EmployeeEmailExistsError();

    let identityAccount: { id: string };
    try {
      identityAccount = await this.identity.createAccount(email, params.password);
    } catch (error) {
      if (isEmailAlreadyExists(error)) throw new EmployeeEmailExistsError();
      throw error;
    }

    return this.repository.create({
      userId: identityAccount.id,
      fullName: params.fullName.trim(),
      companyEmail: email,
      position: params.position.trim(),
      phoneNumber: params.phoneNumber,
    });
  }

  async updateEmployee(id: string, changes: UpdateEmployeeParams) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new EmployeeProfileNotFoundError();
    return this.repository.update(id, changes);
  }

  async getEmployee(id: string) {
    const employee = await this.repository.findById(id);
    if (!employee) throw new EmployeeProfileNotFoundError();
    return employee;
  }

  async listEmployees(query: Partial<AdminEmployeeListQuery>): Promise<AdminEmployeeListResult> {
    const normalized: AdminEmployeeListQuery = {
      page: Math.max(1, query.page ?? DEFAULT_PAGE),
      limit: Math.min(Math.max(query.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT),
    };
    const result = await this.repository.findAll(normalized);
    return { data: result.rows, meta: { ...normalized, total: result.total } };
  }
}

function isEmailAlreadyExists(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'EMAIL_ALREADY_EXISTS';
}

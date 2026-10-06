export interface EmployeeProfile {
  id: string;
  userId: string;
  fullName: string;
  companyEmail: string;
  photoUrl: string | null;
  position: string;
  phoneNumber: string | null;
}

import type { OutboxRepository } from '../events/outbox.types';

export interface EmployeeProfileRepository {
  findByUserId(userId: string): Promise<EmployeeProfile | null>;
  updateSelfProfile(
    userId: string,
    changes: { phoneNumber?: string | null; photoUrl?: string | null },
  ): Promise<EmployeeProfile>;
  updateSelfProfileWithOutbox?(
    userId: string,
    changes: { phoneNumber?: string | null; photoUrl?: string | null },
    event: import('../events/outbox.types').OutboxEventInput,
  ): Promise<EmployeeProfile>;
}

export interface EmployeeProfileDependencies {
  outbox: OutboxRepository;
}

export class EmployeeProfileNotFoundError extends Error {
  readonly code = 'PROFILE_NOT_FOUND';

  constructor() {
    super('The employee profile was not found.');
  }
}

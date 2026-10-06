import crypto from 'node:crypto';
import {
  EmployeeProfileNotFoundError,
  type EmployeeProfile,
  type EmployeeProfileRepository,
} from './employee-profile.types';

export class EmployeeProfileService {
  constructor(
    private readonly profiles: EmployeeProfileRepository,
    private readonly outbox?: import('../events/outbox.types').OutboxRepository,
  ) {}

  async getOwnProfile(userId: string): Promise<EmployeeProfile> {
    const profile = await this.profiles.findByUserId(userId);
    if (!profile) {
      throw new EmployeeProfileNotFoundError();
    }
    return profile;
  }

  async updateOwnProfile(
    userId: string,
    changes: { phoneNumber?: string | null; photoUrl?: string | null },
    correlationId: string = crypto.randomUUID(),
  ): Promise<EmployeeProfile> {
    const existingProfile = await this.profiles.findByUserId(userId);
    if (!existingProfile) {
      throw new EmployeeProfileNotFoundError();
    }
    const changedFields = Object.keys(changes).filter((key) => changes[key as keyof typeof changes] !== undefined);
    const event = {
      eventType: 'employee.profile.updated' as const,
      aggregateType: 'EMPLOYEE' as const,
      aggregateId: existingProfile.id,
      payload: { changedFields },
      occurredAt: new Date(),
      actorId: userId,
      correlationId,
    };

    if (this.profiles.updateSelfProfileWithOutbox) {
      return this.profiles.updateSelfProfileWithOutbox(userId, changes, event);
    }

    const updated = await this.profiles.updateSelfProfile(userId, changes);
    if (this.outbox) await this.outbox.insert(null, event);
    return updated;
  }
}

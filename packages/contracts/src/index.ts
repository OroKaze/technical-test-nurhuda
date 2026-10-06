export type UserRole = 'EMPLOYEE' | 'HRD';

export interface AccessTokenClaims {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export type DomainEventType =
  | 'employee.created'
  | 'employee.profile.updated'
  | 'employee.password.changed'
  | 'attendance.checked.in'
  | 'attendance.checked.out';

export interface DomainEvent<TPayload = Record<string, unknown>> {
  eventId: string;
  schemaVersion: 1;
  eventType: DomainEventType;
  occurredAt: string;
  actorId: string | null;
  aggregateType: 'EMPLOYEE' | 'ATTENDANCE';
  aggregateId: string;
  correlationId: string;
  payload: TPayload;
}

export interface ApiError {
  statusCode: number;
  code: string;
  message: string;
  details: unknown[];
  requestId: string;
}

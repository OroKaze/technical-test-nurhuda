import type { DomainEventType } from '@dexa/contracts';

export interface AttendanceOutboxEvent {
  eventType: Extract<DomainEventType, 'attendance.checked.in' | 'attendance.checked.out'>;
  aggregateId: string;
  employeeId: string;
  attendanceDate: string;
  attendanceTime: Date;
  actorId: string;
  correlationId: string;
}

export interface AttendanceOutboxRepository {
  insert(event: AttendanceOutboxEvent): Promise<void>;
}

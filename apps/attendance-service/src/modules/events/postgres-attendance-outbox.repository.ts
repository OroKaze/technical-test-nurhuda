import { Pool } from 'pg';
import type { AttendanceOutboxEvent, AttendanceOutboxRepository } from './attendance-outbox.types';

export class PostgresAttendanceOutboxRepository implements AttendanceOutboxRepository {
  constructor(private readonly pool: Pool) {}

  async insert(event: AttendanceOutboxEvent): Promise<void> {
    await this.pool.query(
      `INSERT INTO outbox_events
        (event_type, aggregate_type, aggregate_id, payload, occurred_at, actor_id, correlation_id)
       VALUES ($1, 'ATTENDANCE', $2, $3, $4, $5, $6)`,
      [
        event.eventType,
        event.aggregateId,
        JSON.stringify({
          employeeId: event.employeeId,
          attendanceDate: event.attendanceDate,
          attendanceTime: event.attendanceTime.toISOString(),
        }),
        event.attendanceTime,
        event.actorId,
        event.correlationId,
      ],
    );
  }
}

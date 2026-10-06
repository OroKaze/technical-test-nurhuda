import amqp from 'amqplib';
import { Pool } from 'pg';
import { AttendanceOutboxPublisher } from './attendance-outbox.publisher';
import { PostgresAttendanceOutboxPublisherStore } from './attendance-outbox.publisher-store';

class RabbitPublisher {
  constructor(private readonly channel: amqp.Channel) {}

  async publish(routingKey: string, event: Record<string, unknown>): Promise<void> {
    const ok = this.channel.publish(
      'dexa.domain.events',
      routingKey,
      Buffer.from(JSON.stringify(event)),
      { persistent: true, contentType: 'application/json', type: routingKey },
    );
    if (!ok) throw new Error('RabbitMQ publisher buffer is full');
  }
}

export async function startAttendanceOutboxPublisher(): Promise<() => Promise<void>> {
  const pool = new Pool({ connectionString: required('ATTENDANCE_DATABASE_URL') });
  const connection = await amqp.connect(rabbitUrl());
  const channel = await connection.createChannel();
  await channel.assertExchange('dexa.domain.events', 'topic', { durable: true });

  const publisher = new AttendanceOutboxPublisher(
    new PostgresAttendanceOutboxPublisherStore(pool),
    new RabbitPublisher(channel),
  );
  let running = true;
  const loop = (async () => {
    while (running) {
      await publisher.publishBatch();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  })();

  return async () => {
    running = false;
    await loop;
    await channel.close();
    await connection.close();
    await pool.end();
  };
}

function rabbitUrl(): string {
  const user = encodeURIComponent(required('RABBITMQ_USER'));
  const password = encodeURIComponent(required('RABBITMQ_PASSWORD'));
  const host = required('RABBITMQ_HOST');
  const port = process.env.RABBITMQ_PORT ?? '5672';
  const vhost = encodeURIComponent(process.env.RABBITMQ_VHOST ?? '/');
  return `amqp://${user}:${password}@${host}:${port}/${vhost}`;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

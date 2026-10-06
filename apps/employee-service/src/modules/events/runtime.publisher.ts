import amqp from 'amqplib';
import { Pool } from 'pg';
import { OutboxPublisher } from './outbox.publisher';
import { PostgresOutboxPublisherStore } from './postgres-outbox.publisher-store';
import { RabbitMqDomainEventPublisher } from './rabbitmq.publisher';

export async function startOutboxPublisher(): Promise<() => Promise<void>> {
  const pool = new Pool({ connectionString: requireEnvironment('EMPLOYEE_DATABASE_URL') });
  const connection = await amqp.connect(rabbitUrl());
  const channel = await connection.createChannel();
  await channel.assertExchange('dexa.domain.events', 'topic', { durable: true });

  const publisher = new OutboxPublisher(
    new PostgresOutboxPublisherStore(pool),
    new RabbitMqDomainEventPublisher(channel),
  );
  let running = true;
  const loop = async () => {
    while (running) {
      await publisher.publishBatch();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };
  const task = loop();

  return async () => {
    running = false;
    await task;
    await channel.close();
    await connection.close();
    await pool.end();
  };
}

function rabbitUrl(): string {
  const user = encodeURIComponent(requireEnvironment('RABBITMQ_USER'));
  const password = encodeURIComponent(requireEnvironment('RABBITMQ_PASSWORD'));
  const host = requireEnvironment('RABBITMQ_HOST');
  const port = process.env.RABBITMQ_PORT ?? '5672';
  const vhost = encodeURIComponent(process.env.RABBITMQ_VHOST ?? '/');
  return `amqp://${user}:${password}@${host}:${port}/${vhost}`;
}

function requireEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

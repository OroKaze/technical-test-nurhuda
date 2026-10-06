import amqp from 'amqplib';
import { Pool } from 'pg';
import type { DomainEvent } from '@dexa/contracts';
import { AuditEventConsumer } from './audit-event.consumer';
import { PostgresAuditEventStore } from './integration.repository';
import { NotificationConsumer } from './notification.consumer';
import { PostgresNotificationDeliveryStore } from './notification.repository';
import { createNotificationProvider } from './notification.provider';
import { startDeviceTokenServer } from './http-server';

const exchange = 'dexa.domain.events';
const auditQueue = 'audit.events.queue';
const notificationQueue = 'notification.events.queue';

const notificationRetryQueue = 'notification.events.retry';

async function bootstrap(): Promise<void> {
  const pool = new Pool({ connectionString: requireEnvironment('INTEGRATION_DATABASE_URL') });
  const store = new PostgresAuditEventStore(pool);
  const consumer = new AuditEventConsumer(store);
  const notificationConsumer = new NotificationConsumer(
    new PostgresNotificationDeliveryStore(pool),
    createNotificationProvider(),
  );
  const connection = await amqp.connect(rabbitUrl());
  connection.on('error', (err) => {
    console.error('[RabbitMQ] Connection error, exiting for container restart:', err?.message ?? err);
    process.exit(1);
  });
  connection.on('close', () => {
    console.error('[RabbitMQ] Connection closed, exiting for container restart...');
    process.exit(1);
  });
  const channel = await connection.createChannel();

  await channel.assertExchange(exchange, 'topic', { durable: true });
  await channel.assertQueue(auditQueue, { durable: true, deadLetterExchange: `${exchange}.dlx` });
  await channel.assertQueue(notificationQueue, { durable: true, deadLetterExchange: `${exchange}.dlx` });
  await channel.assertQueue(notificationRetryQueue, {
    durable: true,
    arguments: {
      'x-message-ttl': 60000,
      'x-dead-letter-exchange': '',
      'x-dead-letter-routing-key': notificationQueue,
    },
  });
  await channel.assertExchange(`${exchange}.dlx`, 'topic', { durable: true });
  await channel.assertQueue('audit.events.dlq', { durable: true });
  await channel.assertQueue('notification.events.dlq', { durable: true });
  await channel.bindQueue(auditQueue, exchange, 'employee.#');
  await channel.bindQueue(notificationQueue, exchange, 'employee.profile.updated');
  await channel.bindQueue('audit.events.dlq', `${exchange}.dlx`, '#');
  await channel.bindQueue('notification.events.dlq', `${exchange}.dlx`, '#');
  await channel.prefetch(10);

  await channel.consume(auditQueue, async (message) => {
    if (!message) return;
    try {
      const event = JSON.parse(message.content.toString()) as DomainEvent;
      await consumer.consume(event);
      channel.ack(message);
    } catch {
      channel.nack(message, false, false);
    }
  }, { noAck: false });

  await channel.consume(notificationQueue, async (message) => {
    if (!message) return;
    try {
      const event = JSON.parse(message.content.toString()) as DomainEvent;
      const outcome = await notificationConsumer.consume(event);
      if (outcome.retry) {
        channel.publish('', notificationRetryQueue, message.content, { persistent: true });
      }
      channel.ack(message);
    } catch {
      channel.nack(message, false, false);
    }
  }, { noAck: false });

  const httpServer = await startDeviceTokenServer(
    Number(process.env.PORT ?? 3004),
    pool,
    requireEnvironment('JWT_SECRET'),
  );

  const shutdown = async () => {
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    await channel.close();
    await connection.close();
    await pool.end();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());
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

void bootstrap();

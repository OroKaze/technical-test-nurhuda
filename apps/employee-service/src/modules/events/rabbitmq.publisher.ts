import amqp from 'amqplib';
import type { DomainEventPublisher } from './outbox.publisher';

export class RabbitMqDomainEventPublisher implements DomainEventPublisher {
  constructor(
    private readonly channel: amqp.Channel,
    private readonly exchange = 'dexa.domain.events',
  ) {}

  async publish(routingKey: string, event: Record<string, unknown>): Promise<void> {
    const published = this.channel.publish(
      this.exchange,
      routingKey,
      Buffer.from(JSON.stringify(event)),
      { persistent: true, contentType: 'application/json', type: routingKey },
    );
    if (!published) throw new Error('RabbitMQ publisher buffer is full');
  }
}

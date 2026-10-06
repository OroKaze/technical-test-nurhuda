import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './common/domain-exception.filter';
import { startAttendanceOutboxPublisher } from './modules/events/attendance-runtime.publisher';
import type { Server } from 'node:http';

let stopPublisher: (() => Promise<void>) | undefined;
let httpServer: Server | undefined;

async function shutdown(): Promise<void> {
  await stopPublisher?.();
  await new Promise<void>((resolve) => httpServer?.close(() => resolve()));
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown());
process.on('SIGINT', () => void shutdown());

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new DomainExceptionFilter());
  httpServer = await app.listen(Number(process.env.PORT ?? 3003), '0.0.0.0');
  stopPublisher = await startAttendanceOutboxPublisher();
}

void bootstrap();

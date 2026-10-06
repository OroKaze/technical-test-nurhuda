import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './common/domain-exception.filter';
import { startOutboxPublisher } from './modules/events/runtime.publisher';
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
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useStaticAssets(process.env.UPLOADS_DIRECTORY ?? '/app/uploads', { prefix: '/uploads' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new DomainExceptionFilter());
  httpServer = await app.listen(Number(process.env.PORT ?? 3002), '0.0.0.0');
  stopPublisher = await startOutboxPublisher();
}

void bootstrap();

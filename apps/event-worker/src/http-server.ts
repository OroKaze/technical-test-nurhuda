import { createServer } from 'node:http';
import { Pool } from 'pg';
import { DeviceTokenService } from './device-token.service';
import { PostgresDeviceTokenStore } from './device-token.repository';
import { DeviceTokenHttpHandler } from './device-token.http';

export function startDeviceTokenServer(port: number, pool: Pool, jwtSecret: string): Promise<import('node:http').Server> {
  const service = new DeviceTokenService(new PostgresDeviceTokenStore(pool));
  const handler = new DeviceTokenHttpHandler(service, jwtSecret);
  const server = createServer(async (request, response) => {
    if (request.url !== '/internal/notifications/device-tokens' || (request.method !== 'POST' && request.method !== 'DELETE')) {
      response.statusCode = 404; response.end(); return;
    }
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const result = await handler.handle({
      method: request.method,
      url: request.url,
      headers: { authorization: request.headers.authorization },
      body: JSON.parse(Buffer.concat(chunks).toString() || '{}'),
    });
    response.statusCode = result.status;
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify(result.body));
  });
  return new Promise((resolve) => server.listen(port, '0.0.0.0', () => resolve(server)));
}

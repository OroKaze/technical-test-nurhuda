import jwt from 'jsonwebtoken';
import type { UserRole } from '@dexa/contracts';
import { InvalidDeviceTokenError } from './device-token.service';

interface TokenService {
  register(userId: string, token: string): Promise<void>;
  remove(userId: string, token: string): Promise<void>;
}

interface HttpRequest {
  method: string;
  url: string;
  headers: Record<string, string | undefined>;
  body?: { token?: string };
}

interface HttpResponse {
  status: number;
  body: Record<string, unknown>;
}

interface Claims {
  sub: string;
  role: UserRole;
}

export class DeviceTokenHttpHandler {
  constructor(
    private readonly tokens: TokenService,
    private readonly jwtSecret: string,
  ) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const claims = this.authenticate(request.headers.authorization);
    if (!claims) return { status: 401, body: { code: 'UNAUTHORIZED' } };
    if (claims.role !== 'HRD') return { status: 403, body: { code: 'FORBIDDEN' } };

    if (request.method === 'DELETE') {
      if (!request.body?.token) return { status: 400, body: { code: 'INVALID_DEVICE_TOKEN' } };
      try {
        await this.tokens.remove(claims.sub, request.body.token);
      } catch (error) {
        if (error instanceof InvalidDeviceTokenError) return { status: 400, body: { code: 'INVALID_DEVICE_TOKEN' } };
        throw error;
      }
      return { status: 200, body: { status: 'deactivated' } };
    }

    if (request.method !== 'POST' || !request.body?.token) {
      return { status: 400, body: { code: 'INVALID_DEVICE_TOKEN' } };
    }
    try {
      await this.tokens.register(claims.sub, request.body.token);
    } catch (error) {
      if (error instanceof InvalidDeviceTokenError) return { status: 400, body: { code: 'INVALID_DEVICE_TOKEN' } };
      throw error;
    }
    return { status: 200, body: { status: 'registered' } };
  }

  private authenticate(header: string | undefined): Claims | null {
    if (!header?.startsWith('Bearer ')) return null;
    try {
      const payload = jwt.verify(header.slice(7), this.jwtSecret);
      if (typeof payload === 'string' || typeof payload.sub !== 'string') return null;
      if (payload.role !== 'HRD' && payload.role !== 'EMPLOYEE') return null;
      return { sub: payload.sub, role: payload.role };
    } catch {
      return null;
    }
  }
}

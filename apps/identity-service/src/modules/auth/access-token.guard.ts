import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAccessTokenService } from './jwt-token';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly tokens: JwtAccessTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: unknown }>();
    const authorization = request.header('authorization');
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : null;

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      request.user = this.tokens.verify(token);
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}

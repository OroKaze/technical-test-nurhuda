import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import type { AccessTokenClaims } from '@dexa/contracts';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  private readonly secret = process.env.JWT_SECRET ?? '';

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: AccessTokenClaims }>();
    const authorization = request.header('authorization');
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : null;
    if (!token || !this.secret) throw new UnauthorizedException();

    try {
      const payload = jwt.verify(token, this.secret);
      if (typeof payload === 'string' || !isClaims(payload)) throw new UnauthorizedException();
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}

function isClaims(payload: jwt.JwtPayload): payload is AccessTokenClaims {
  return typeof payload.sub === 'string' && typeof payload.email === 'string' && (payload.role === 'EMPLOYEE' || payload.role === 'HRD');
}

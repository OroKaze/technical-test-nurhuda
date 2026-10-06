import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { AccessTokenClaims } from '@dexa/contracts';

/**
 * Allows only authenticated HRD users. Must run after AccessTokenGuard.
 */
@Injectable()
export class HrdGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: AccessTokenClaims }>();
    if (request.user?.role !== 'HRD') {
      throw new ForbiddenException('This endpoint requires the HRD role.');
    }
    return true;
  }
}

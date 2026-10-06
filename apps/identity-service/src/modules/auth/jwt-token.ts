import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import type { UserRole } from '@dexa/contracts';

export interface AccessTokenClaims {
  sub: string;
  email: string;
  role: UserRole;
}

export interface AccessTokenService {
  sign(claims: AccessTokenClaims): string;
  verify(token: string): AccessTokenClaims;
}

export class JwtAccessTokenService implements AccessTokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string | number = '15m',
  ) {}

  sign(claims: AccessTokenClaims): string {
    return jwt.sign(claims, this.secret, { expiresIn: this.expiresIn as SignOptions['expiresIn'] });
  }

  verify(token: string): AccessTokenClaims {
    const payload = jwt.verify(token, this.secret);

    if (!isAccessTokenClaims(payload)) {
      throw new Error('Invalid access token claims');
    }

    return payload;
  }
}

function isAccessTokenClaims(payload: string | JwtPayload): payload is AccessTokenClaims {
  return (
    typeof payload !== 'string' &&
    typeof payload.sub === 'string' &&
    typeof payload.email === 'string' &&
    (payload.role === 'EMPLOYEE' || payload.role === 'HRD')
  );
}

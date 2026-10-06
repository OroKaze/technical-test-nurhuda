import { Catch, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import {
  CurrentPasswordError,
  EmailAlreadyExistsError,
  InactiveAccountError,
  InvalidCompanyEmailError,
  InvalidCredentialsError,
  UserNotFoundError,
} from '../modules/auth/auth.types';

const clientErrors = [
  InvalidCredentialsError,
  InactiveAccountError,
  CurrentPasswordError,
  UserNotFoundError,
  InvalidCompanyEmailError,
  EmailAlreadyExistsError,
] as const;

@Catch(...clientErrors)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: Error & { code?: string }, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof UserNotFoundError ? 404
      : exception instanceof CurrentPasswordError || exception instanceof InvalidCompanyEmailError ? 400
      : exception instanceof EmailAlreadyExistsError ? 409
      : 401;

    response.status(status).json({
      statusCode: status,
      code: exception.code ?? 'AUTHENTICATION_ERROR',
      message: exception.message,
      details: [],
      requestId: response.getHeader('x-request-id') ?? 'request-not-assigned',
    });
  }
}

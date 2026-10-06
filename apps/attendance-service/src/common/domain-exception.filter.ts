import { Catch, ForbiddenException, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import {
  AttendanceAlreadyCheckedInError,
  AttendanceAlreadyCheckedOutError,
  CheckInRequiredError,
  InvalidDateRangeError,
} from '../modules/attendance/attendance.types';

type DomainError = Error & { code: string };

@Catch(
  AttendanceAlreadyCheckedInError,
  AttendanceAlreadyCheckedOutError,
  CheckInRequiredError,
  InvalidDateRangeError,
)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof InvalidDateRangeError ? 400 : 409;

    response.status(status).json({
      statusCode: status,
      code: exception.code,
      message: exception.message,
      details: [],
      requestId: response.getHeader('x-request-id') ?? 'request-not-assigned',
    });
  }
}

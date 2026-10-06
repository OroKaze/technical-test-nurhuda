import { Catch, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { EmployeeProfileNotFoundError } from '../modules/employees/employee-profile.types';
import { EmployeeEmailExistsError, EmployeeInvalidCompanyEmailError } from '../modules/employees/admin-employee.types';
import { InvalidProfilePhotoError } from '../modules/employees/profile-photo.storage';

@Catch(EmployeeProfileNotFoundError, EmployeeEmailExistsError, EmployeeInvalidCompanyEmailError, InvalidProfilePhotoError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: Error & { code?: string }, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof EmployeeProfileNotFoundError ? 404
      : exception instanceof EmployeeEmailExistsError ? 409
      : 400;
    response.status(status).json({
      statusCode: status,
      code: exception.code ?? 'DOMAIN_ERROR',
      message: exception.message,
      details: [],
      requestId: response.getHeader('x-request-id') ?? 'request-not-assigned',
    });
  }
}

export interface ApiErrorPayload {
  statusCode?: number;
  code?: string;
  message?: string;
  details?: unknown[];
  requestId?: string;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details: unknown[];
  readonly requestId?: string;

  constructor(status: number, message: string, code = 'UNKNOWN_ERROR', details: unknown[] = [], requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }

  get isConflict(): boolean {
    return this.statusCode === 409 || this.code.includes('ALREADY') || this.code.includes('EXISTS');
  }

  get isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  get isForbidden(): boolean {
    return this.statusCode === 403;
  }

  get isValidation(): boolean {
    return this.statusCode === 400 || this.code === 'VALIDATION_ERROR';
  }
}

export function parseApiError(error: unknown, fallbackMessage = 'An unexpected error occurred'): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof Error) {
    return new ApiError(500, error.message || fallbackMessage);
  }
  return new ApiError(500, fallbackMessage);
}

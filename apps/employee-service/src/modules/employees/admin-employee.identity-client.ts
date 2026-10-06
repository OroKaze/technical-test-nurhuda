import type { IdentityAccountClient } from './admin-employee.types';

export class HttpIdentityAccountClient implements IdentityAccountClient {
  constructor(
    private readonly identityServiceUrl: string,
    private readonly fetcher: (input: string | URL, init?: RequestInit) => Promise<Response> = fetch,
  ) {}

  async createAccount(email: string, password: string): Promise<{ id: string }> {
    const response = await this.fetcher(`${this.identityServiceUrl}/api/v1/internal/users`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ email, password, role: 'EMPLOYEE' }),
    });

    const body = await response.json() as { id?: string; code?: string; message?: string };
    if (!response.ok) {
      const error = new Error(body.message ?? 'Identity account creation failed') as Error & { code?: string };
      error.code = body.code;
      throw error;
    }
    if (!body.id) throw new Error('Identity service returned no user id');
    return { id: body.id };
  }
}

export type EmployeeProfileRoute = 'profile';

export interface ProxyResult {
  status: number;
  body: unknown;
}

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

export class EmployeeProxyService {
  constructor(
    private readonly employeeServiceUrl: string,
    private readonly fetcher: FetchLike = fetch,
  ) {}

  async forward(
    route: EmployeeProfileRoute,
    method: 'GET' | 'PATCH',
    body?: unknown,
    authorization?: string,
  ): Promise<ProxyResult> {
    const headers = new Headers({ accept: 'application/json' });
    if (body !== undefined) headers.set('content-type', 'application/json');
    if (authorization) headers.set('authorization', authorization);

    const response = await this.fetcher(`${this.employeeServiceUrl}/api/v1/me/profile`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const contentType = response.headers.get('content-type') ?? '';
    const responseBody = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    return { status: response.status, body: responseBody };
  }
}

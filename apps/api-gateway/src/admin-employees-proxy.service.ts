export type AdminEmployeeMethod = 'GET' | 'POST' | 'PATCH';

export interface ProxyResult {
  status: number;
  body: unknown;
}

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

export class AdminEmployeesProxyService {
  constructor(
    private readonly employeeServiceUrl: string,
    private readonly fetcher: FetchLike = fetch,
  ) {}

  async forward(
    method: AdminEmployeeMethod,
    suffix = '',
    authorization?: string,
    body?: unknown,
  ): Promise<ProxyResult> {
    const headers = new Headers({ accept: 'application/json' });
    if (authorization) headers.set('authorization', authorization);
    if (body !== undefined) headers.set('content-type', 'application/json');

    const response = await this.fetcher(
      `${this.employeeServiceUrl}/api/v1/admin/employees${suffix}`,
      {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      },
    );
    const contentType = response.headers.get('content-type') ?? '';
    const responseBody = contentType.includes('application/json')
      ? await response.json()
      : await response.text();
    return { status: response.status, body: responseBody };
  }
}

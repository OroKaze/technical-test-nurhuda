export type IdentityAuthRoute = 'login' | 'me' | 'change-password';

export interface ProxyResult {
  status: number;
  body: unknown;
}

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

export class AuthProxyService {
  constructor(
    private readonly identityServiceUrl: string,
    private readonly fetcher: FetchLike = fetch,
  ) {}

  async forward(route: IdentityAuthRoute, body?: unknown, authorization?: string): Promise<ProxyResult> {
    const method = route === 'me' ? 'GET' : 'POST';
    const headers = new Headers({ accept: 'application/json' });
    if (body !== undefined) headers.set('content-type', 'application/json');
    if (authorization) headers.set('authorization', authorization);

    const response = await this.fetcher(
      `${this.identityServiceUrl}/api/v1/auth/${route === 'change-password' ? 'change-password' : route}`,
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

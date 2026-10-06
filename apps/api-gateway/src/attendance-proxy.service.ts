export type AttendanceRoute = 'check-in' | 'check-out' | 'summary';

export interface ProxyResult {
  status: number;
  body: unknown;
}

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

export class AttendanceProxyService {
  constructor(
    private readonly attendanceServiceUrl: string,
    private readonly fetcher: FetchLike = fetch,
  ) {}

  async forward(route: AttendanceRoute, authorization?: string, queryString?: string): Promise<ProxyResult> {
    const headers = new Headers({ accept: 'application/json' });
    if (authorization) headers.set('authorization', authorization);

    const method = route === 'summary' ? 'GET' : 'POST';
    const suffix = route === 'summary' && queryString ? `summary?${queryString}` : route;

    const response = await this.fetcher(`${this.attendanceServiceUrl}/api/v1/attendance/${suffix}`, {
      method,
      headers,
    });
    const contentType = response.headers.get('content-type') ?? '';
    const responseBody = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    return { status: response.status, body: responseBody };
  }
}

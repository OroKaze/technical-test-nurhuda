export interface ProxyResult {
  status: number;
  body: unknown;
}

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

export class AdminAttendanceProxyService {
  constructor(
    private readonly attendanceServiceUrl: string,
    private readonly fetcher: FetchLike = fetch,
  ) {}

  async forward(authorization: string | undefined, queryString: string): Promise<ProxyResult> {
    const headers = new Headers({ accept: 'application/json' });
    if (authorization) headers.set('authorization', authorization);

    const suffix = queryString ? `?${queryString}` : '';
    const response = await this.fetcher(`${this.attendanceServiceUrl}/api/v1/admin/attendance${suffix}`, {
      method: 'GET',
      headers,
    });
    const contentType = response.headers.get('content-type') ?? '';
    const responseBody = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    return { status: response.status, body: responseBody };
  }
}

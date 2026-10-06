export interface DeviceTokenProxyResult { status: number; body: unknown }

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

export class DeviceTokenProxyService {
  constructor(
    private readonly workerUrl: string,
    private readonly fetcher: FetchLike = fetch,
  ) {}

  async forward(method: 'POST' | 'DELETE', authorization: string | undefined, token: string): Promise<DeviceTokenProxyResult> {
    const headers = new Headers({ 'content-type': 'application/json', accept: 'application/json' });
    if (authorization) headers.set('authorization', authorization);
    const response = await this.fetcher(`${this.workerUrl}/internal/notifications/device-tokens`, {
      method,
      headers,
      body: JSON.stringify({ token }),
    });
    return { status: response.status, body: await response.json() };
  }
}

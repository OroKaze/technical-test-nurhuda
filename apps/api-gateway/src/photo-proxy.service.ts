export interface ProxyResult {
  status: number;
  body: unknown;
}

export interface PhotoFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

export class PhotoProxyService {
  constructor(
    private readonly employeeServiceUrl: string,
    private readonly fetcher: FetchLike = fetch,
  ) {}

  async forward(file: PhotoFile, authorization?: string): Promise<ProxyResult> {
    const form = new FormData();
    const bytes = new Uint8Array(file.buffer);
    form.append('photo', new Blob([bytes], { type: file.mimetype }), file.originalname);
    const headers = new Headers({ accept: 'application/json' });
    if (authorization) headers.set('authorization', authorization);
    const response = await this.fetcher(`${this.employeeServiceUrl}/api/v1/me/profile/photo`, {
      method: 'POST',
      headers,
      body: form,
    });
    const contentType = response.headers.get('content-type') ?? '';
    const body = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    return { status: response.status, body };
  }
}

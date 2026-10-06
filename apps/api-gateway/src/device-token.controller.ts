import { Body, Controller, Delete, Headers, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { DeviceTokenProxyService } from './device-token-proxy.service';

@Controller('notifications/device-tokens')
export class DeviceTokenController {
  constructor(private readonly proxy: DeviceTokenProxyService) {}

  @Post()
  register(@Headers('authorization') authorization: string | undefined, @Body('token') token: string, @Res() response: Response) {
    return this.respond(response, this.proxy.forward('POST', authorization, token));
  }

  @Delete()
  remove(@Headers('authorization') authorization: string | undefined, @Body('token') token: string, @Res() response: Response) {
    return this.respond(response, this.proxy.forward('DELETE', authorization, token));
  }

  private async respond(response: Response, request: Promise<{ status: number; body: unknown }>) {
    const result = await request;
    return response.status(result.status).json(result.body);
  }
}

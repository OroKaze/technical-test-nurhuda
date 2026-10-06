import { Body, Controller, Get, Headers, Patch, Res } from '@nestjs/common';
import type { Response } from 'express';
import { EmployeeProxyService } from './employee-proxy.service';

@Controller('me/profile')
export class EmployeeController {
  constructor(private readonly proxy: EmployeeProxyService) {}

  @Get()
  getProfile(@Headers('authorization') authorization: string | undefined, @Res() response: Response) {
    return this.respond(response, this.proxy.forward('profile', 'GET', undefined, authorization));
  }

  @Patch()
  updateProfile(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: unknown,
    @Res() response: Response,
  ) {
    return this.respond(response, this.proxy.forward('profile', 'PATCH', body, authorization));
  }

  private async respond(response: Response, request: Promise<{ status: number; body: unknown }>) {
    const result = await request;
    return response.status(result.status).json(result.body);
  }
}

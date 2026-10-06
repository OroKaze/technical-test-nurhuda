import { Body, Controller, Get, Headers, HttpCode, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthProxyService } from './auth-proxy.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly proxy: AuthProxyService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() body: unknown, @Res() response: Response) {
    return this.respond(response, this.proxy.forward('login', body));
  }

  @Get('me')
  me(@Headers('authorization') authorization: string | undefined, @Res() response: Response) {
    return this.respond(response, this.proxy.forward('me', undefined, authorization));
  }

  @Post('change-password')
  @HttpCode(204)
  changePassword(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: unknown,
    @Res() response: Response,
  ) {
    return this.respond(response, this.proxy.forward('change-password', body, authorization));
  }

  private async respond(response: Response, request: Promise<{ status: number; body: unknown }>) {
    const result = await request;
    if (result.status === 204) return response.status(204).send();
    return response.status(result.status).json(result.body);
  }
}

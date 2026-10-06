import { Controller, Get, Headers, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AttendanceProxyService } from './attendance-proxy.service';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly proxy: AttendanceProxyService) {}

  @Post('check-in')
  checkIn(@Headers('authorization') authorization: string | undefined, @Res() response: Response) {
    return this.respond(response, this.proxy.forward('check-in', authorization));
  }

  @Post('check-out')
  checkOut(@Headers('authorization') authorization: string | undefined, @Res() response: Response) {
    return this.respond(response, this.proxy.forward('check-out', authorization));
  }

  @Get('summary')
  summary(
    @Headers('authorization') authorization: string | undefined,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Res() response: Response,
  ) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return this.respond(response, this.proxy.forward('summary', authorization, params.toString()));
  }

  private async respond(response: Response, request: Promise<{ status: number; body: unknown }>) {
    const result = await request;
    return response.status(result.status).json(result.body);
  }
}

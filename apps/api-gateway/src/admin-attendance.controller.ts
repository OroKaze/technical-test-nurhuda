import { Controller, Get, Headers, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AdminAttendanceProxyService } from './admin-attendance-proxy.service';

@Controller('admin/attendance')
export class AdminAttendanceController {
  constructor(private readonly proxy: AdminAttendanceProxyService) {}

  @Get()
  monitor(
    @Headers('authorization') authorization: string | undefined,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('employeeId') employeeId: string | undefined,
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @Res() response: Response,
  ) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (employeeId) params.set('employeeId', employeeId);
    if (page) params.set('page', page);
    if (limit) params.set('limit', limit);
    return this.respond(response, this.proxy.forward(authorization, params.toString()));
  }

  private async respond(response: Response, request: Promise<{ status: number; body: unknown }>) {
    const result = await request;
    return response.status(result.status).json(result.body);
  }
}

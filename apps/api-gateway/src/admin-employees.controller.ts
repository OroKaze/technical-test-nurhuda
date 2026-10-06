import { Body, Controller, Get, Headers, Param, Patch, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AdminEmployeesProxyService } from './admin-employees-proxy.service';

@Controller('admin/employees')
export class AdminEmployeesController {
  constructor(private readonly proxy: AdminEmployeesProxyService) {}

  @Get()
  list(
    @Headers('authorization') authorization: string | undefined,
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @Res() response: Response,
  ) {
    const params = new URLSearchParams();
    if (page) params.set('page', page);
    if (limit) params.set('limit', limit);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return this.respond(response, this.proxy.forward('GET', suffix, authorization));
  }

  @Get(':id')
  get(@Param('id') id: string, @Headers('authorization') authorization: string | undefined, @Res() response: Response) {
    return this.respond(response, this.proxy.forward('GET', `/${encodeURIComponent(id)}`, authorization));
  }

  @Post()
  create(@Body() body: unknown, @Headers('authorization') authorization: string | undefined, @Res() response: Response) {
    return this.respond(response, this.proxy.forward('POST', '', authorization, body));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('authorization') authorization: string | undefined,
    @Res() response: Response,
  ) {
    return this.respond(response, this.proxy.forward('PATCH', `/${encodeURIComponent(id)}`, authorization, body));
  }

  private async respond(response: Response, request: Promise<{ status: number; body: unknown }>) {
    const result = await request;
    return response.status(result.status).json(result.body);
  }
}

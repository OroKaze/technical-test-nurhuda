import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { UploadsProxyService } from './uploads-proxy.service';

@Controller('uploads/profile')
export class UploadsController {
  constructor(private readonly proxy: UploadsProxyService) {}

  @Get(':filename')
  async getProfilePhoto(@Param('filename') filename: string, @Res() response: Response) {
    const result = await this.proxy.getProfilePhoto(filename);
    return response.status(result.status).type(result.contentType).send(result.body);
  }
}

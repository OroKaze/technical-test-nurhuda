import { Controller, Headers, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { PhotoProxyService, type PhotoFile } from './photo-proxy.service';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

@Controller('me/profile')
export class PhotoController {
  constructor(private readonly proxy: PhotoProxyService) {}

  @Post('photo')
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: MAX_PHOTO_BYTES } }))
  async upload(
    @UploadedFile() file: PhotoFile | undefined,
    @Headers('authorization') authorization: string | undefined,
    @Res() response: Response,
  ) {
    if (!file) return response.status(400).json({ code: 'PHOTO_REQUIRED' });
    const result = await this.proxy.forward(file, authorization);
    return response.status(result.status).json(result.body);
  }
}

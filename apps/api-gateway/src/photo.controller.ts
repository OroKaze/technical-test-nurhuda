import { Controller, Headers, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { PhotoProxyService, type PhotoFile } from './photo-proxy.service';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Controller('me/profile')
export class PhotoController {
  constructor(private readonly proxy: PhotoProxyService) {}

  @Post('photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: { fileSize: MAX_PHOTO_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return cb(null, false);
        }
        cb(null, true);
      },
    }),
  )
  async upload(
    @UploadedFile() file: PhotoFile | undefined,
    @Headers('authorization') authorization: string | undefined,
    @Res() response: Response,
  ) {
    if (!file) {
      return response.status(400).json({
        statusCode: 400,
        code: 'INVALID_PROFILE_PHOTO',
        message: 'Profile photo is required and must be a valid JPEG, PNG, or WebP image under 2 MB.',
      });
    }
    const result = await this.proxy.forward(file, authorization);
    return response.status(result.status).json(result.body);
  }
}

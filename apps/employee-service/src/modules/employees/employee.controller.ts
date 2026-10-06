import { BadRequestException, Body, Controller, Get, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { ProfilePhotoStorage } from './profile-photo.storage';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import type { Request } from 'express';
import type { AccessTokenClaims } from '@dexa/contracts';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { EmployeeProfileService } from './employee-profile.service';

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(30)
  @Matches(/^\+?[0-9 ()-]+$/)
  phoneNumber?: string;
}

type AuthenticatedRequest = Request & { user?: AccessTokenClaims };

@Controller('me/profile')
@UseGuards(AccessTokenGuard)
export class EmployeeController {
  constructor(
    private readonly profiles: EmployeeProfileService,
    private readonly photos: ProfilePhotoStorage,
  ) {}

  @Get()
  getProfile(@Req() request: AuthenticatedRequest) {
    return this.profiles.getOwnProfile(requireUserId(request));
  }

  @Patch()
  updateProfile(@Req() request: AuthenticatedRequest, @Body() body: UpdateProfileDto) {
    return this.profiles.updateOwnProfile(requireUserId(request), { phoneNumber: body.phoneNumber });
  }

  @Post('photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimes.includes(file.mimetype)) {
          return cb(new BadRequestException('Only JPEG, PNG, and WebP images are accepted'), false);
        }
        cb(null, true);
      },
    }),
  )
  async updatePhoto(@Req() request: AuthenticatedRequest, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Profile photo is required');
    const stored = await this.photos.store({
      mimetype: file.mimetype,
      originalname: file.originalname,
      size: file.size,
      buffer: file.buffer,
    });
    return this.profiles.updateOwnProfile(requireUserId(request), { photoUrl: stored.url });
  }
}

function requireUserId(request: AuthenticatedRequest): string {
  if (!request.user?.sub) throw new Error('Missing authenticated user');
  return request.user.sub;
}

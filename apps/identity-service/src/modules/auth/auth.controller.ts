import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import type { AccessTokenClaims } from './jwt-token';
import { AccessTokenGuard } from './access-token.guard';

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}

type AuthenticatedRequest = Request & { user?: AccessTokenClaims };

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginDto) {
    return this.auth.login(body.email, body.password);
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  me(@Req() request: AuthenticatedRequest) {
    return this.auth.getCurrentUser(requireUserId(request));
  }

  @Post('change-password')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(@Req() request: AuthenticatedRequest, @Body() body: ChangePasswordDto): Promise<void> {
    await this.auth.changePassword(requireUserId(request), body.currentPassword, body.newPassword);
  }
}

function requireUserId(request: AuthenticatedRequest): string {
  if (!request.user?.sub) {
    throw new UnauthorizedException();
  }
  return request.user.sub;
}

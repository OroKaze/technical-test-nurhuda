import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';

class CreateInternalUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsIn(['EMPLOYEE', 'HRD'])
  role!: 'EMPLOYEE' | 'HRD';
}

@Controller('internal/users')
export class InternalUsersController {
  constructor(private readonly auth: AuthService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: CreateInternalUserDto) {
    return this.auth.createUser(body.email, body.password, body.role);
  }
}

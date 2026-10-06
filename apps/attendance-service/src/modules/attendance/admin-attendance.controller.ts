import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import type { Request } from 'express';
import type { AccessTokenClaims } from '@dexa/contracts';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { HrdGuard } from '../auth/hrd.guard';
import { AdminAttendanceService } from './admin-attendance.service';

class AdminAttendanceQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

type AuthenticatedRequest = Request & { user?: AccessTokenClaims };

@Controller('admin/attendance')
@UseGuards(AccessTokenGuard, HrdGuard)
export class AdminAttendanceController {
  constructor(private readonly adminAttendance: AdminAttendanceService) {}

  @Get()
  monitor(@Req() _request: AuthenticatedRequest, @Query() query: AdminAttendanceQueryDto) {
    return this.adminAttendance.monitor(query, new Date());
  }
}

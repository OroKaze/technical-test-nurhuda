import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, Matches } from 'class-validator';
import type { Request } from 'express';
import type { AccessTokenClaims } from '@dexa/contracts';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { AttendanceService } from './attendance.service';

class SummaryQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;
}

type AuthenticatedRequest = Request & { user?: AccessTokenClaims };

@Controller('attendance')
@UseGuards(AccessTokenGuard)
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Post('check-in')
  checkIn(@Req() request: AuthenticatedRequest) {
    return this.attendance.checkIn(requireEmployeeId(request), new Date());
  }

  @Post('check-out')
  checkOut(@Req() request: AuthenticatedRequest) {
    return this.attendance.checkOut(requireEmployeeId(request), new Date());
  }

  @Get('summary')
  summary(@Req() request: AuthenticatedRequest, @Query() query: SummaryQueryDto) {
    return this.attendance.summary(requireEmployeeId(request), query.from, query.to);
  }
}

function requireEmployeeId(request: AuthenticatedRequest): string {
  if (!request.user?.sub || request.user.role !== 'EMPLOYEE') {
    throw new Error('Attendance actions require an authenticated employee');
  }
  return request.user.sub;
}

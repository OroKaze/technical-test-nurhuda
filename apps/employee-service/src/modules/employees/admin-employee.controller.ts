import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { IsEmail, IsInt, IsOptional, IsString, Matches, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { HrdGuard } from '../auth/hrd.guard';
import { EmployeeManagementService } from './admin-employee.service';

class CreateEmployeeDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsEmail()
  companyEmail!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(2)
  position!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9 ()-]+$/)
  phoneNumber?: string;
}

class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  position?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9 ()-]+$/)
  phoneNumber?: string;
}

class ListEmployeesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

@Controller('admin/employees')
@UseGuards(AccessTokenGuard, HrdGuard)
export class AdminEmployeeController {
  constructor(private readonly employees: EmployeeManagementService) {}

  @Get()
  list(@Query() query: ListEmployeesDto) {
    return this.employees.listEmployees(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.employees.getEmployee(id);
  }

  @Post()
  create(@Body() body: CreateEmployeeDto) {
    return this.employees.createEmployee(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateEmployeeDto) {
    return this.employees.updateEmployee(id, body);
  }
}

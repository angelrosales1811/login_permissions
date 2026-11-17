import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';

export class AuditHistoryQueryDto {
  @ApiPropertyOptional({
    example: 'ROLES',
  })
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiPropertyOptional({
    example: 'UPDATE',
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({
    example: 'abc97121-c050-4bbe-a6e1-b39ccb68da0b',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    example: '2026-11-01',
  })
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional({
    example: '2026-11-30',
  })
  @IsOptional()
  @IsString()
  toDate?: string;

  @ApiPropertyOptional({
    example: 1,
  })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({
    example: 50,
  })
  @IsOptional()
  @IsNumberString()
  limit?: string;
}

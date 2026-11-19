import { ApiPropertyOptional } from '@nestjs/swagger';

import { Transform } from 'class-transformer';

import { IsBoolean, IsOptional } from 'class-validator';

export class CatalogFilterDto {
  @ApiPropertyOptional({
    description: 'Filtra registros por estado lógico.',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : undefined))
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({
    description: 'Incluye activos e inactivos.',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeInactive?: boolean;
}

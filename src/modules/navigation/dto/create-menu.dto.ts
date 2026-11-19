import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateMenuDto {
  @ApiProperty({
    example: 'ADMINISTRATION',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  internal_name!: string;

  @ApiProperty({
    example: 'Administración',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  external_name!: string;

  @ApiProperty({
    example: 'settings',
    required: false,
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({
    example: 1,
  })
  @IsInt()
  @Min(0)
  display_order!: number;

  @ApiProperty({
    example: '8d0f7816-f64d-4f01-b6bc-c21192ee6f06',
  })
  @IsUUID()
  application_id!: string;
}

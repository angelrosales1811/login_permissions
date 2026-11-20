import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateMenuItemDto {
  @ApiProperty()
  @IsUUID()
  menu_id: string;

  @ApiProperty()
  @IsUUID()
  module_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  internal_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  external_name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  route?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  display_order: number;

  @ApiProperty()
  @IsUUID()
  application_id: string;
}

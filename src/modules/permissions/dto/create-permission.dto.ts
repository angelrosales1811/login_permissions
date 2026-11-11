import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty()
  @IsString()
  internal_name!: string;

  @ApiProperty()
  @IsString()
  external_name!: string;

  @ApiProperty()
  @IsString()
  @Length(3, 3)
  permission_code!: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

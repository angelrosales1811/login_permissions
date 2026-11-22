import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateRolePermissionStatusDto {
  @ApiProperty({
    example: false,
  })
  @IsBoolean()
  active!: boolean;
}

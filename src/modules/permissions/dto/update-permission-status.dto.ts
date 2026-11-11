import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdatePermissionStatusDto {
  @ApiProperty()
  @IsBoolean()
  active!: boolean;
}

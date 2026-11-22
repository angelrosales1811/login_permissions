import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateRoleModuleStatusDto {
  @ApiProperty({
    example: false,
    description: 'Estado lógico de la relación Role-Module',
  })
  @IsBoolean()
  active!: boolean;
}

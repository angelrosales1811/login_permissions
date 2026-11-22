import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignUserRoleDto {
  @ApiProperty({
    description: 'UUID del rol a asignar.',
    example: '676ba779-7c0e-406e-bfbf-ddacee9a769c',
  })
  @IsUUID('4')
  roleId!: string;
}

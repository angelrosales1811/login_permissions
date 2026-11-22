import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignRoleModuleDto {
  @ApiProperty({
    description: 'UUID del módulo',
    example: '9e4e8062-cc45-4f77-84f4-2e6eab479a15',
  })
  @IsUUID('4')
  moduleId!: string;
}

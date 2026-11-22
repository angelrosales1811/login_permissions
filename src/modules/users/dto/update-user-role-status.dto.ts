import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateUserRoleStatusDto {
  @ApiProperty({
    example: false,
    description:
      'Estado lógico de la asignación usuario-rol. false = desactivado. true = activo. La modificación ejecuta Permission Cache Auto-Rebuild.',
  })
  @IsBoolean()
  active!: boolean;
}

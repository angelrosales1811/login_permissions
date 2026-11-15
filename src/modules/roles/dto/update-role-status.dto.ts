import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateRoleStatusDto {
  @ApiProperty({
    example: true,
    description:
      'Estado lógico del rol. true = rol activo y disponible para asignación y validación RBAC. false = rol desactivado. La desactivación provoca la reconstrucción automática de permission_cache para los usuarios afectados mediante el mecanismo Permission Cache Auto-Rebuild.',
  })
  @IsBoolean()
  active!: boolean;
}

import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateRoleDto } from './create-role.dto';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @ApiProperty({
    required: false,
    example: 'IAM_ADMIN',
    description:
      'Nombre interno único del rol. Se utiliza internamente por el sistema para validaciones RBAC, autorización dinámica y asignación de permisos.',
  })
  internal_name?: string;

  @ApiProperty({
    required: false,
    example: 'Administrador IAM',
    description:
      'Nombre visible del rol utilizado en interfaces administrativas, reportes y pantallas de gestión.',
  })
  external_name?: string;

  @ApiProperty({
    required: false,
    example:
      'Rol con acceso completo a la administración de identidades, roles, permisos y configuración RBAC.',
    description:
      'Descripción funcional del rol. Permite documentar alcance, responsabilidades y propósito dentro del modelo de seguridad.',
  })
  description?: string;
}

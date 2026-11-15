import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    example: 'IAM_ADMIN',
    description:
      'Nombre interno único del rol utilizado por el sistema para validaciones RBAC, autorización y control de acceso. Se recomienda utilizar MAYÚSCULAS y guiones bajos para mantener consistencia.',
  })
  @IsString()
  internal_name!: string;

  @ApiProperty({
    example: 'Administrador IAM',
    description:
      'Nombre descriptivo mostrado en la interfaz de usuario, reportes administrativos y matrices RBAC.',
  })
  @IsString()
  external_name!: string;

  @ApiProperty({
    required: false,
    example:
      'Rol con acceso completo a la administración de identidades, roles, permisos y configuración RBAC.',
    description:
      'Descripción funcional del rol. Permite documentar responsabilidades, alcance y propósito dentro del modelo de seguridad.',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

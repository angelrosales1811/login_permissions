import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreatePermissionDto } from './create-permission.dto';

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {
  @ApiProperty({
    required: false,
    example: 'read_only',
    description:
      'Nombre interno único del permiso. Utilizado por el motor RBAC para identificar y administrar permisos dentro del sistema. Debe mantenerse estable para evitar impactos en configuraciones existentes.',
  })
  internal_name?: string;

  @ApiProperty({
    required: false,
    example: 'Solo Lectura',
    description:
      'Nombre descriptivo mostrado en interfaces administrativas, matrices RBAC, reportes y pantallas de gestión.',
  })
  external_name?: string;

  @ApiProperty({
    required: false,
    example: '444',
    minLength: 3,
    maxLength: 3,
    description: `
        Código de autorización asociado al permiso.

        Longitud obligatoria: 3 caracteres.

        Ejemplos:

        - 444 = Solo lectura
        - 644 = Lectura y actualización
        - 755 = Administración avanzada
        - 777 = Control total
        - 810 = Permiso funcional personalizado

        Impacto arquitectónico:

        Permission
        ↓
        Role Permissions
        ↓
        Permission Cache
        ↓
        JWT.permissions
        ↓
        PermissionsGuard
        ↓
        Autorización dinámica

        Importante:

        La modificación de este valor puede afectar asignaciones RBAC existentes y provocar invalidación de permission_cache mediante los mecanismos de sincronización implementados.
        `,
  })
  permission_code?: string;

  @ApiProperty({
    required: false,
    example: 'Permite consultar información sin capacidad de creación, modificación o eliminación.',
    description:
      'Descripción funcional del permiso. Debe documentar claramente el alcance del acceso otorgado, las restricciones aplicables y el propósito dentro de la matriz RBAC.',
  })
  description?: string;
}

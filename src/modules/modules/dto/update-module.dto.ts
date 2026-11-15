import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateModuleDto } from './create-module.dto';

export class UpdateModuleDto extends PartialType(CreateModuleDto) {
  @ApiProperty({
    required: false,
    example: 'USERS',
    description:
      'Nombre interno único del módulo. Utilizado por el sistema para identificar funcionalmente el módulo dentro de la aplicación y en los procesos RBAC.',
  })
  internal_name?: string;

  @ApiProperty({
    required: false,
    example: 'Usuarios',
    description:
      'Nombre visible mostrado en interfaces administrativas, navegación dinámica, matrices RBAC y reportes funcionales.',
  })
  external_name?: string;

  @ApiProperty({
    required: false,
    example: '/iam/users',
    description:
      'Ruta principal utilizada por el frontend para acceder a la funcionalidad asociada al módulo.',
  })
  route?: string;

  @ApiProperty({
    required: false,
    example: 'people',
    description:
      'Icono utilizado para representar visualmente el módulo dentro de menús y componentes de navegación.',
  })
  icon?: string;

  @ApiProperty({
    required: false,
    example: 10,
    description: `
        Orden de visualización del módulo.

        Valores menores se muestran antes en la navegación.

        Ejemplo:

        1  = Dashboard
        10 = Usuarios
        20 = Roles
        30 = Permisos

        Utilizado por la construcción de menús dinámicos.
        `,
  })
  display_order?: number;

  @ApiProperty({
    required: false,
    example: '30aa6643-de90-4dee-845c-687a31dc781f',
    description: `
        UUID de la aplicación propietaria del módulo.

        Debe corresponder a un registro existente en public.applications.

        Relación arquitectónica:

        Application
        ↓
        Module
        ↓
        Resource
        ↓
        Role Modules
        ↓
        Role Permissions
        ↓
        Permission Cache
        ↓
        JWT Permissions
        ↓
        PermissionsGuard

        La modificación puede impactar navegación dinámica, matrices RBAC y asignaciones funcionales.
        `,
  })
  application_id?: string;
}

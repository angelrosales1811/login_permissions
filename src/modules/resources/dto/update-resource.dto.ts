import { ApiProperty, PartialType } from '@nestjs/swagger';

import { CreateResourceDto } from './create-resource.dto';

export class UpdateResourceDto extends PartialType(CreateResourceDto) {
  @ApiProperty({
    required: false,
    example: 'USERS',
    description:
      'Nombre interno único del recurso. Es utilizado por el modelo RBAC para identificar entidades protegidas dentro del sistema y para la generación de permission_cache, JWT y validaciones de autorización dinámica.',
  })
  internal_name?: string;

  @ApiProperty({
    required: false,
    example: 'Usuarios',
    description:
      'Nombre visible mostrado en interfaces administrativas, matrices RBAC, reportes de auditoría y pantallas de configuración.',
  })
  external_name?: string;

  @ApiProperty({
    required: false,
    example:
      'Administración de usuarios, asignación de roles y gestión de accesos dentro de la plataforma.',
    description:
      'Descripción funcional del recurso. Debe documentar claramente el propósito de la entidad protegida y su alcance dentro del modelo IAM.',
  })
  description?: string;

  @ApiProperty({
    required: false,
    example: '30aa6643-de90-4dee-845c-687a31dc781f',
    description: `
        UUID de la aplicación propietaria del recurso.

        Debe corresponder a un registro existente en public.applications.

        Impacto arquitectónico:

        Application
        ↓
        Module
        ↓
        Resource
        ↓
        Role Permissions
        ↓
        Permission Cache
        ↓
        JWT Permissions
        ↓
        PermissionsGuard

        La modificación puede afectar la organización funcional y la matriz RBAC asociada al recurso.
        `,
  })
  application_id?: string;

  @ApiProperty({
    required: false,
    type: [String],
    example: ['c4cfca5f-3f63-4d2b-88dd-31cf47bd5f18', '8fd4c5a5-98f1-4d8e-a42d-9b0462d0798b'],
    description: `
        Lista de módulos asociados al recurso.

        La operación funciona como actualización de la asignación funcional del recurso dentro de la arquitectura:

        Application
        ↓
        Module
        ↓
        Resource

        Relaciones impactadas:

        - public.modules
        - public.module_resources
        - public.role_modules
        - public.role_permissions
        - security.permission_cache

        Impacto funcional:

        Modules
        ↓
        Resources
        ↓
        Role Modules
        ↓
        Role Permissions
        ↓
        Permission Cache
        ↓
        JWT
        ↓
        Autorización dinámica

        Los UUID enviados deben corresponder a módulos válidos registrados en public.modules.
        `,
  })
  module_ids?: string[];
}

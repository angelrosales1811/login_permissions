import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ValidateNested } from 'class-validator';

import { Type } from 'class-transformer';

export class RolePermissionItemDto {
  @ApiProperty({
    example: '08edb391-5051-48bc-b876-94dff41ce6ee',
    description:
      'Identificador único (UUID) del recurso al que se asignará un permiso. El recurso debe existir previamente en public.resources y representa una entidad protegida por RBAC, por ejemplo: APPLICATIONS, MODULES, RESOURCES, PERMISSIONS, ROLES o USERS.',
  })
  @IsUUID()
  resourceId!: string;

  @ApiProperty({
    example: 'd355eea1-0984-4cfd-ad34-726d2e238661',
    description:
      'Identificador único (UUID) del permiso que será asociado al recurso. Debe existir en public.permissions. Ejemplos comunes: 444 (solo lectura), 644 (lectura y actualización), 755 (administración avanzada) y 777 (control total).',
  })
  @IsUUID()
  permissionId!: string;

  @ApiProperty({
    example: '30aa6643-de90-4dee-845c-687a31dc781f',
    description:
      'Identificador único (UUID) de la aplicación propietaria del recurso. Permite agrupar permisos y recursos por dominio funcional dentro de la plataforma.',
  })
  @IsUUID()
  applicationId!: string;
}

export class UpdateRolePermissionsDto {
  @ApiProperty({
    type: [RolePermissionItemDto],
    description: `
      REEMPLAZO COMPLETO DE MATRIZ RBAC DEL ROL (FULL REPLACEMENT).

      Este endpoint NO realiza actualizaciones parciales.

      La colección enviada representa el estado final de la matriz de permisos para el rol seleccionado.

      Comportamiento interno:

      1. Se identifican las relaciones actuales del rol.
      2. Las relaciones existentes son desactivadas.
      3. Se aplican las relaciones enviadas en la solicitud.
      4. Se ejecuta Permission Cache Auto-Rebuild.
      5. Se actualiza security.permission_cache para todos los usuarios afectados.

      Consecuencia importante:

      Todo recurso NO incluido en la lista será desactivado automáticamente para el rol.

      Tablas involucradas:

      - public.role_permissions
      - public.permissions
      - public.resources
      - public.roles
      - security.permission_cache

      Impacto arquitectónico:

      Role Permissions
      ↓
      Permission Cache Auto-Rebuild
      ↓
      security.permission_cache
      ↓
      JWT Permissions
      ↓
      PermissionsGuard
      ↓
      Autorización dinámica de endpoints
      `,
    example: {
      permissions: [
        {
          resourceId: '08edb391-5051-48bc-b876-94dff41ce6ee',
          permissionId: 'd355eea1-0984-4cfd-ad34-726d2e238661',
          applicationId: '30aa6643-de90-4dee-845c-687a31dc781f',
        },
        {
          resourceId: 'abcc330b-a3e8-4b13-ac9e-feb142ec826b',
          permissionId: 'c4f1d417-6e45-467e-b022-8c113fa7bbc3',
          applicationId: '30aa6643-de90-4dee-845c-687a31dc781f',
        },
      ],
    },
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RolePermissionItemDto)
  permissions!: RolePermissionItemDto[];
}

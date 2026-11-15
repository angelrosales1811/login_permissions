import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdatePermissionStatusDto {
  @ApiProperty({
    example: true,
    description: `
      Estado lógico del permiso.

      Valores posibles:

      - true = Permiso activo y disponible para asignación RBAC.
      - false = Permiso desactivado y no disponible para nuevas asignaciones.

      Impacto funcional:

      Permission Status Change
      ↓
      Role Permissions
      ↓
      Permission Cache Invalidate
      ↓
      Permission Cache Auto-Rebuild
      ↓
      JWT Permissions
      ↓
      PermissionsGuard
      ↓
      Autorización dinámica de endpoints

      Importante:

      La desactivación no elimina registros históricos ni relaciones existentes, pero puede afectar los permisos efectivos de los usuarios al reconstruirse security.permission_cache.

      Tablas relacionadas:

      - public.permissions
      - public.role_permissions
      - security.permission_cache

      Uso típico:

      true  → Activar permiso
      false → Desactivar permiso
      `,
  })
  @IsBoolean()
  active!: boolean;
}

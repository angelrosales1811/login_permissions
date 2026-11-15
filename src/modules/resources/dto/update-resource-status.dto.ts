import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateResourceStatusDto {
  @ApiProperty({
    example: true,
    description: `
      Estado lógico del recurso.

      Valores permitidos:

      - true  = Recurso activo y disponible para asignación RBAC.
      - false = Recurso desactivado y excluido de nuevas configuraciones funcionales.

      Impacto arquitectónico:

      Resource Status Change
      ↓
      Role Permissions
      ↓
      Permission Cache Invalidate
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

      Importante:

      La desactivación es lógica (soft delete) y no elimina información histórica ni registros relacionados.

      Dependiendo de las asignaciones existentes, el cambio puede afectar los permisos efectivos de los usuarios cuando se reconstruya el permission cache.

      Tablas relacionadas:

      - public.resources
      - public.role_permissions
      - public.module_resources
      - security.permission_cache

      Casos de uso:

      true  → Reactivar recurso para volver a utilizarlo dentro del modelo RBAC.
      false → Retirar el recurso de forma controlada sin perder trazabilidad ni auditoría.
      `,
  })
  @IsBoolean()
  active!: boolean;
}

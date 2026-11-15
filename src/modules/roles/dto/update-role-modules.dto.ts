import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class UpdateRoleModulesDto {
  @ApiProperty({
    type: [String],
    description: `
      REEMPLAZO COMPLETO DE MÓDULOS DEL ROL (FULL REPLACEMENT).

      Este endpoint opera bajo el principio de sincronización total.

      La lista enviada representa la configuración final de módulos que permanecerán asociados al rol.

      Comportamiento interno:

      1. Se identifican las asociaciones actuales del rol.
      2. Las relaciones existentes son desactivadas.
      3. Se activan o crean las asociaciones enviadas.
      4. Se ejecuta Permission Cache Auto-Rebuild.
      5. Se actualizan los permisos efectivos de los usuarios afectados.

      Importante:

      Todos los módulos que NO sean enviados en esta lista serán desactivados automáticamente para el rol.

      Tablas involucradas:

      - public.role_modules
      - public.modules
      - public.module_resources
      - public.role_permissions
      - security.permission_cache

      Impacto arquitectónico:

      Role Modules
      ↓
      Module Resources
      ↓
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

      Ejemplo:

      Un rol puede tener acceso a:

      - USERS
      - ROLES
      - PERMISSIONS
      - AUDIT

      Si únicamente se envían USERS y ROLES, los módulos PERMISSIONS y AUDIT serán desactivados para ese rol.
      `,
    example: [
      'c4cfca5f-3f63-4d2b-88dd-31cf47bd5f18',
      '8fd4c5a5-98f1-4d8e-a42d-9b0462d0798b',
      '57a8f2db-fd5c-4f5e-bfb8-c159d32cf9e9',
    ],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  moduleIds!: string[];
}

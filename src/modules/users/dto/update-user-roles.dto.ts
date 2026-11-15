import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class UpdateUserRolesDto {
  @ApiProperty({
    type: [String],
    description: `
      REEMPLAZO COMPLETO DE ROLES DEL USUARIO (FULL REPLACEMENT).

      Este endpoint NO agrega roles incrementalmente.

      La lista enviada representa la asignación final de roles que tendrá el usuario.

      Comportamiento interno:

      1. Se identifican los roles actualmente asignados al usuario.
      2. Las relaciones existentes son desactivadas.
      3. Se activan o crean las relaciones enviadas.
      4. Se ejecuta Permission Cache Auto-Rebuild.
      5. Se actualiza security.permission_cache para el usuario.
      6. Los nuevos permisos estarán disponibles en futuras autenticaciones y renovaciones de JWT.

      Importante:

      Todo rol que NO sea enviado en la lista será desactivado automáticamente para el usuario.

      Tablas involucradas:

      - public.user_roles
      - public.roles
      - public.role_permissions
      - security.permission_cache

      Impacto arquitectónico:

      User Roles
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

      Un usuario actualmente tiene:

      - ADMINISTRATOR
      - IAM_ADMIN
      - AUDITOR

      Si únicamente se envían:

      - ADMINISTRATOR
      - IAM_ADMIN

      entonces AUDITOR será desactivado para dicho usuario.
      `,
    example: ['676ba779-7c0e-406e-bfbf-ddacee9a769c', '12a8262a-4a6a-46cd-b602-790b05c7009b'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  roleIds!: string[];
}

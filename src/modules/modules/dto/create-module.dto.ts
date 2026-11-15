import { ApiProperty } from '@nestjs/swagger';

import { IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateModuleDto {
  @ApiProperty({
    example: 'USERS',
    description:
      'Nombre interno único del módulo. Es utilizado por el sistema para identificar funcionalmente el módulo dentro de la aplicación y para las relaciones RBAC. Se recomienda utilizar MAYÚSCULAS y guiones bajos para mantener consistencia.',
  })
  @IsString()
  internal_name!: string;

  @ApiProperty({
    example: 'Usuarios',
    description:
      'Nombre visible mostrado en interfaces administrativas, menús dinámicos, matrices RBAC y reportes funcionales.',
  })
  @IsString()
  external_name!: string;

  @ApiProperty({
    required: false,
    example: '/iam/users',
    description:
      'Ruta principal utilizada por el frontend para navegar hacia la funcionalidad representada por el módulo. Puede utilizarse posteriormente para la construcción automática de menús dinámicos.',
  })
  @IsOptional()
  @IsString()
  route?: string;

  @ApiProperty({
    required: false,
    example: 'people',
    description:
      'Identificador del icono utilizado por el frontend para representar visualmente el módulo dentro de menús y opciones de navegación.',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({
    required: false,
    example: 10,
    description: `
      Orden de visualización del módulo.

      Los valores más bajos se muestran primero.

      Ejemplo:

      1  = Dashboard
      10 = Usuarios
      20 = Roles
      30 = Permisos

      Utilizado principalmente por la navegación dinámica.
      `,
  })
  @IsOptional()
  @IsInt()
  display_order?: number;

  @ApiProperty({
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
      ↓
      Autorización dinámica

      Ejemplos de aplicaciones:

      - IAM
      - CRM
      - PORTAL
      `,
  })
  @IsUUID()
  application_id!: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateResourceDto {
  @ApiProperty({
    example: 'USERS',
    description:
      'Nombre interno único del recurso. Es utilizado por el motor RBAC para identificar entidades protegidas dentro del sistema. Se recomienda utilizar MAYÚSCULAS y guiones bajos para mantener consistencia con el resto de los recursos del catálogo.',
  })
  @IsString()
  internal_name!: string;

  @ApiProperty({
    example: 'Usuarios',
    description:
      'Nombre visible mostrado en interfaces administrativas, matrices RBAC, auditorías y pantallas de configuración.',
  })
  @IsString()
  external_name!: string;

  @ApiProperty({
    required: false,
    example:
      'Administración de usuarios, asignación de roles y gestión de accesos dentro de la plataforma.',
    description:
      'Descripción funcional del recurso. Debe documentar claramente el propósito de la entidad protegida dentro del modelo de autorización.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '30aa6643-de90-4dee-845c-687a31dc781f',
    description: `
      UUID de la aplicación propietaria del recurso.

      Debe corresponder a un registro existente en public.applications.

      Relación arquitectónica:

      Application
      ↓
      Module
      ↓
      Resource
      ↓
      Role Permission
      ↓
      Permission Cache
      ↓
      JWT Permissions
      ↓
      PermissionsGuard

      Ejemplos de aplicaciones:

      - IAM
      - CRM
      - PORTAL
      `,
  })
  @IsUUID()
  application_id!: string;

  @ApiProperty({
    type: [String],
    example: ['c4cfca5f-3f63-4d2b-88dd-31cf47bd5f18', '8fd4c5a5-98f1-4d8e-a42d-9b0462d0798b'],
    description: `
      Lista de módulos asociados al recurso.

      Cada UUID debe corresponder a un registro válido en public.modules.

      Permite establecer la relación:

      Application
      ↓
      Module
      ↓
      Resource

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

      Ejemplos de módulos asociados:

      - USERS
      - ROLES
      - PERMISSIONS
      - AUDIT
      - APPLICATIONS

      Un recurso puede pertenecer a uno o varios módulos según la organización funcional definida en IAM.
      `,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  module_ids!: string[];
}

import { ApiProperty } from '@nestjs/swagger';

import { IsOptional, IsString } from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty({
    example: 'IAM',
    description: `
      Código único de la aplicación dentro de la plataforma.

      Debe ser corto, estable y fácilmente identificable.

      Ejemplos:

      - IAM
      - CRM
      - PORTAL
      - INVENTORY
      - AUDIT

      Este código es utilizado en:

      - JWT.permissions
      - Permission Cache
      - PermissionsGuard
      - Matriz RBAC
      - Menú dinámico

      Ejemplo de autorización:

      IAM
      ↓
      ROLES
      ↓
      444
      `,
  })
  @IsString()
  code!: string;

  @ApiProperty({
    example: 'Identity Access Management',
    description:
      'Nombre descriptivo de la aplicación mostrado en interfaces administrativas, menús, auditorías y catálogos funcionales.',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    required: false,
    example: 'Administración de identidades, roles, permisos, recursos y seguridad de acceso.',
    description:
      'Descripción funcional de la aplicación. Debe documentar el propósito de negocio y el alcance funcional dentro del ecosistema de aplicaciones.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    required: false,
    example: 'shield',
    description:
      'Identificador del icono utilizado por el frontend para representar visualmente la aplicación en tableros, menús o catálogos.',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({
    required: false,
    example: '/iam',
    description: `
      Ruta principal de acceso utilizada por el frontend.

      Ejemplos:

      - /iam
      - /crm
      - /portal
      - /inventory

      Relación arquitectónica:

      Application
      ↓
      Modules
      ↓
      Resources
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
      `,
  })
  @IsOptional()
  @IsString()
  route?: string;
}

import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateApplicationDto } from './create-application.dto';

export class UpdateApplicationDto extends PartialType(CreateApplicationDto) {
  @ApiProperty({
    required: false,
    example: 'IAM',
    description: `
        Código único de la aplicación.

        Identifica funcionalmente la aplicación dentro de toda la arquitectura IAM.

        Ejemplos:

        - IAM
        - CRM
        - PORTAL
        - INVENTORY
        - AUDIT

        Este valor participa en:

        Application
        ↓
        Permission Cache
        ↓
        JWT.permissions
        ↓
        PermissionsGuard
        ↓
        Autorización dinámica

        Se recomienda mantener el código estable una vez que existan recursos, módulos y permisos asociados.
        `,
  })
  code?: string;

  @ApiProperty({
    required: false,
    example: 'Identity Access Management',
    description:
      'Nombre descriptivo de la aplicación mostrado en interfaces administrativas, catálogos, reportes y menús del sistema.',
  })
  name?: string;

  @ApiProperty({
    required: false,
    example:
      'Administración de identidades, autenticación, autorización, roles, permisos y auditoría.',
    description:
      'Descripción funcional de la aplicación. Permite documentar el alcance de negocio y las funcionalidades administradas por la aplicación.',
  })
  description?: string;

  @ApiProperty({
    required: false,
    example: 'shield',
    description:
      'Identificador del icono utilizado por el frontend para representar visualmente la aplicación dentro de menús, dashboards y catálogos.',
  })
  icon?: string;

  @ApiProperty({
    required: false,
    example: '/iam',
    description: `
        Ruta base utilizada por el frontend para acceder a la aplicación.

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

        La modificación de esta propiedad puede requerir ajustes en el frontend y en la navegación dinámica.
        `,
  })
  route?: string;
}

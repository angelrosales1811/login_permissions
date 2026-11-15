import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    example: 'read_only',
    description:
      'Nombre interno único del permiso utilizado por el sistema para reglas RBAC, autorización dinámica y configuración de accesos. Debe mantenerse estable para evitar impactos en configuraciones existentes.',
  })
  @IsString()
  internal_name!: string;

  @ApiProperty({
    example: 'Solo Lectura',
    description:
      'Nombre descriptivo mostrado en interfaces administrativas, matrices RBAC, catálogos de permisos y reportes de auditoría.',
  })
  @IsString()
  external_name!: string;

  @ApiProperty({
    example: '444',
    minLength: 3,
    maxLength: 3,
    description: `
      Código de autorización utilizado por el modelo RBAC.

      Longitud obligatoria: 3 caracteres.

      Ejemplos comunes:

      - 444 = Solo lectura
      - 644 = Lectura y actualización
      - 755 = Administración avanzada
      - 777 = Control total
      - 810 = Permiso funcional personalizado

      Estos códigos son utilizados por:

      Permission Cache
      ↓
      JWT Permissions
      ↓
      PermissionsGuard
      ↓
      Autorización dinámica de endpoints

      Importante:

      El valor debe ser único dentro del catálogo de permisos.
      `,
  })
  @IsString()
  @Length(3, 3)
  permission_code!: string;

  @ApiProperty({
    required: false,
    example: 'Permite consultar información sin capacidad de creación, modificación o eliminación.',
    description:
      'Descripción funcional del permiso. Debe documentar claramente el alcance del acceso otorgado y su uso dentro de la matriz RBAC.',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

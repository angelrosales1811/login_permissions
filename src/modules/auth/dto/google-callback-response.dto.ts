import { ApiProperty } from '@nestjs/swagger';

class GoogleUserDto {
  @ApiProperty({
    example: 'ad07de09-1a68-4cc2-a944-75a555433beb',
    description:
      'Identificador único del usuario en Supabase Authentication. Corresponde al UID externo utilizado durante los procesos de autenticación OAuth.',
  })
  auth_user_id!: string;

  @ApiProperty({
    example: 'admin@crm.com',
    description: 'Correo electrónico autenticado y validado por Google OAuth mediante Supabase.',
  })
  email!: string;

  @ApiProperty({
    example: 'Norma Romero',
    description:
      'Nombre completo recuperado desde el proveedor OAuth. Puede ser nulo cuando el proveedor no envía esta información.',
    nullable: true,
  })
  full_name?: string;

  @ApiProperty({
    example: 'https://lh3.googleusercontent.com/a/example',
    description:
      'URL pública del avatar proporcionado por Google. Puede ser nula cuando el usuario no tiene imagen asociada o el proveedor no la expone.',
    nullable: true,
  })
  avatar_url?: string;

  @ApiProperty({
    example: ['ADMINISTRATOR', 'IAM_ADMIN'],
    description:
      'Roles RBAC activos asignados al usuario dentro de la plataforma. Estos roles participan en la generación de permission_cache y en la construcción de los permisos incluidos posteriormente en el JWT.',
  })
  roles!: string[];
}

export class GoogleCallbackResponseDto {
  @ApiProperty({
    example: true,
    description:
      'Indica si la autenticación OAuth fue exitosa y el usuario fue autenticado correctamente dentro de la plataforma.',
  })
  authenticated!: boolean;

  @ApiProperty({
    example: false,
    description:
      'Indica si el perfil local fue creado durante esta autenticación. true = primer acceso, false = usuario previamente registrado.',
  })
  profileCreated!: boolean;

  @ApiProperty({
    example: false,
    description:
      'Indica si durante el proceso de aprovisionamiento fue necesario asignar automáticamente el rol Guest al usuario.',
  })
  guestAssigned!: boolean;

  @ApiProperty({
    example: true,
    description:
      'Confirma si el sistema generó o validó correctamente la información de permission_cache necesaria para la autorización RBAC.',
  })
  permissionCacheGenerated!: boolean;

  @ApiProperty({
    example: 2,
    description:
      'Cantidad de registros generados dentro de security.permission_cache durante el proceso de aprovisionamiento o recuperación de permisos.',
  })
  permissionRecords!: number;

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmM5NzEyMS1jMDUwLTRiYmUtYTZlMS1iMzljY2I2OGRhMGIiLCJpYXQiOjE3OTQ2ODk3NjcsImV4cCI6MTc5NDcxODU2N30.signature',
    description:
      'Access Token JWT utilizado para consumir endpoints protegidos. Incluye roles, permisos RBAC, sessionId y datos básicos del usuario.',
  })
  accessToken!: string;

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmM5NzEyMS1jMDUwLTRiYmUtYTZlMS1iMzljY2I2OGRhMGIiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc5NDY4OTc2NywiZXhwIjoxNzk3MjgxNzY3fQ.signature',
    description:
      'Refresh Token utilizado para renovar Access Tokens sin requerir una nueva autenticación con Google OAuth.',
  })
  refreshToken!: string;

  @ApiProperty({
    example: '28c9b618-e4e8-492a-8070-abb5540e394b',
    description:
      'Identificador único de la sesión creada durante el proceso de autenticación. Utilizado para control de sesiones activas y validaciones de seguridad.',
  })
  sessionId!: string;

  @ApiProperty({
    type: GoogleUserDto,
    description:
      'Información consolidada del usuario autenticado y aprovisionado dentro de la plataforma después de completar el flujo OAuth.',
  })
  user!: GoogleUserDto;
}

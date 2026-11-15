import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permission.guard';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';

import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear usuario',
    description: `
    Endpoint reservado para futuras operaciones administrativas de creación de usuarios.

    Actualmente el flujo principal de aprovisionamiento es:

    Google OAuth
    ↓
    User Profile
    ↓
    Asignación de Roles
    ↓
    Permission Cache
    ↓
    JWT

    Permiso requerido:

    IAM / USERS / 755
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado correctamente',
  })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes',
  })
  @Permissions('IAM', 'USERS', '755')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar usuarios',
    description: `
    Obtiene el listado de usuarios registrados.

    Utilizado para:

    - Administración IAM
    - Asignación de Roles
    - Auditoría
    - Gestión de Accesos

    Permiso requerido:

    IAM / USERS / 444
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de usuarios obtenido correctamente',
  })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes',
  })
  @Permissions('IAM', 'USERS', '444')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id/roles')
  @ApiOperation({
    summary: 'Consultar roles del usuario',
    description: `
    Obtiene todos los roles activos asignados a un usuario.

    Fuente:

    public.user_roles

    Modelo RBAC:

    Usuario
    ↓
    Roles
    ↓
    Role Permissions
    ↓
    Permission Cache
    ↓
    JWT
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'Roles obtenidos correctamente',
    schema: {
      example: [
        {
          id: 'e1f5e4e2-1111-2222-3333-444444444444',
          user_id: 'abc97121-c050-4bbe-a6e1-b39ccb68da0b',
          role_id: '676ba779-7c0e-406e-bfbf-ddacee9a769c',
          active: true,
        },
        {
          id: 'e1f5e4e2-5555-6666-7777-888888888888',
          user_id: 'abc97121-c050-4bbe-a6e1-b39ccb68da0b',
          role_id: '12a8262a-4a6a-46cd-b602-790b05c7009b',
          active: true,
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes',
  })
  @Permissions('IAM', 'USERS', '444')
  getUserRoles(@Param('id') id: string) {
    return this.usersService.getUserRoles(id);
  }

  @Put(':id/roles')
  @ApiOperation({
    summary: 'Reemplazar roles del usuario',
    description: `
    Reemplaza completamente la asignación de roles del usuario.

    Comportamiento:

    Roles actuales
    ↓
    Desactivar relaciones existentes
    ↓
    Aplicar nueva asignación
    ↓
    Permission Cache Auto-Rebuild
    ↓
    JWT actualizado en siguiente autenticación

    Importante:

    La lista enviada representa la configuración final.
    Los roles no incluidos serán desactivados.

    Tablas involucradas:

    - public.user_roles
    - public.role_permissions
    - security.permission_cache

    Permiso requerido:

    IAM / USERS / 644
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'Roles actualizados correctamente',
    schema: {
      example: {
        success: true,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario o rol no encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes',
  })
  @Permissions('IAM', 'USERS', '644')
  updateUserRoles(@Param('id') id: string, @Body() dto: UpdateUserRolesDto) {
    return this.usersService.updateUserRoles(id, dto);
  }
}

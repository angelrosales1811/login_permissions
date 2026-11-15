import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { PermissionsGuard } from '../auth/guards/permission.guard';

import { Permissions } from '../auth/decorators/permission.decorator';

import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleModulesDto } from './dto/update-role-modules.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';

import { UpdateRoleStatusDto } from './dto/update-role-status.dto';

import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@ApiBearerAuth('JWT-auth')
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear rol',
    description: `
      Crea un nuevo rol dentro del sistema IAM.

      Ejemplos:

      ADMINISTRATOR
      IAM_ADMIN
      AUDITOR
      SUPERVISOR

      Permiso requerido:

      IAM / ROLES / 755
      `,
  })
  @ApiResponse({
    status: 201,
    description: 'Rol creado correctamente',
  })
  @ApiResponse({
    status: 409,
    description: 'El rol ya existe',
  })
  @Permissions('IAM', 'ROLES', '755')
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar roles',
    description: `
      Obtiene todos los roles registrados.

      Utilizado por:

      - Administración IAM
      - Asignación User Roles
      - Matriz RBAC
      `,
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de roles',
  })
  @Permissions('IAM', 'ROLES', '444')
  findAll() {
    return this.rolesService.findAll();
  }

  @Get('permission-matrix')
  @ApiOperation({
    summary: 'Obtener matriz RBAC',
    description: `
      Devuelve la matriz consolidada:

      Módulo
      ↓
      Recurso
      ↓
      Rol
      ↓
      Permisos

      Utilizado para auditoría y revisión de accesos.
      `,
  })
  @ApiResponse({
    status: 200,
    description: 'Matriz RBAC obtenida correctamente',
  })
  @Permissions('IAM', 'ROLES', '444')
  permissionMatrix() {
    return this.rolesService.getPermissionMatrix();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener rol por ID',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del rol',
  })
  @ApiResponse({
    status: 200,
    description: 'Rol encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Rol no encontrado',
  })
  @Permissions('IAM', 'ROLES', '444')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar rol',
    description: `
      Permite modificar:

      - external_name
      - description

      No modifica permisos ni módulos.
      `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del rol',
  })
  @ApiResponse({
    status: 200,
    description: 'Rol actualizado correctamente',
  })
  @Permissions('IAM', 'ROLES', '644')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Activar o desactivar rol',
    description: `
      Realiza baja lógica del rol.

      Proceso interno:

      Role Status Change
      ↓
      Permission Cache Auto-Rebuild
      ↓
      Usuarios afectados actualizados

      Permiso requerido:

      IAM / ROLES / 777
      `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del rol',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado correctamente',
  })
  @Permissions('IAM', 'ROLES', '777')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateRoleStatusDto) {
    return this.rolesService.updateStatus(id, dto.active);
  }

  @Get(':id/permissions')
  @ApiOperation({
    summary: 'Consultar permisos del rol',
    description: `
      Obtiene los permisos efectivos asignados al rol.

      Tabla relacionada:

      public.role_permissions
      `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del rol',
  })
  @ApiResponse({
    status: 200,
    description: 'Permisos obtenidos correctamente',
  })
  @Permissions('IAM', 'ROLES', '444')
  getRolePermissions(@Param('id') id: string) {
    return this.rolesService.getRolePermissions(id);
  }

  @Put(':id/permissions')
  @ApiOperation({
    summary: 'Reemplazar matriz completa de permisos del rol',
    description: `
      La lista enviada sustituye completamente la matriz RBAC actual del rol.

      Comportamiento:

      Permisos actuales
      ↓
      Desactivar
      ↓
      Aplicar nueva matriz
      ↓
      Permission Cache Auto-Rebuild

      Los permisos no enviados serán desactivados.

      Tabla:

      public.role_permissions
      `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del rol',
  })
  @ApiResponse({
    status: 200,
    description: 'Matriz RBAC actualizada correctamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Rol, recurso o permiso no encontrado',
  })
  @Permissions('IAM', 'ROLES', '644')
  updateRolePermissions(@Param('id') id: string, @Body() dto: UpdateRolePermissionsDto) {
    return this.rolesService.updateRolePermissions(id, dto);
  }

  @Get(':id/modules')
  @ApiOperation({
    summary: 'Consultar módulos del rol',
    description: `
      Obtiene todos los módulos asignados al rol.

      Tabla relacionada:

      public.role_modules
      `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del rol',
  })
  @ApiResponse({
    status: 200,
    description: 'Módulos obtenidos correctamente',
  })
  @Permissions('IAM', 'ROLES', '444')
  getRoleModules(@Param('id') id: string) {
    return this.rolesService.getRoleModules(id);
  }

  @Put(':id/modules')
  @ApiOperation({
    summary: 'Reemplazar módulos del rol',
    description: `
          La lista enviada sustituye completamente los módulos asociados al rol.

          Proceso:

          Role Modules
          ↓
          Actualización
          ↓
          Permission Cache Auto-Rebuild
          ↓
          Usuarios afectados actualizados

          Los módulos no enviados serán desactivados.

          Tabla:

          public.role_modules
          `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del rol',
  })
  @ApiResponse({
    status: 200,
    description: 'Módulos actualizados correctamente',
  })
  @Permissions('IAM', 'ROLES', '644')
  updateRoleModules(@Param('id') id: string, @Body() dto: UpdateRoleModulesDto) {
    return this.rolesService.updateRoleModules(id, dto);
  }
}

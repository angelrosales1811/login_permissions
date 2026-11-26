import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { PermissionsGuard } from '../auth/guards/permission.guard';

import { Permissions } from '../auth/decorators/permission.decorator';

import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleModulesDto } from './dto/update-role-modules.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';

import { UpdateRoleStatusDto } from './dto/update-role-status.dto';

import { CatalogFilterDto } from '../../common/dto/catalog-filter.dto';
import { AssignRoleModuleDto } from './dto/assign-role-module.dto';
import { AssignRolePermissionDto } from './dto/assign-role-permission.dto';
import { UpdateRoleModuleStatusDto } from './dto/update-role-module-status.dto';
import { UpdateRolePermissionStatusDto } from './dto/update-role-permission-status.dto';
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
  @Permissions('IAM', 'ROLES', '444')
  @ApiOperation({
    summary: 'Listar roles',
    description: `
      Por defecto retorna únicamente registros activos.

      Filtros disponibles:

      GET ?active=true
      Retorna activos.

      GET ?active=false
      Retorna inactivos.

      GET ?includeInactive=true
      Retorna activos e inactivos.

      Utilizado para:
      - Soft Delete
      - Reactivación
      - Auditoría
      - Administración IAM
      `,
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de roles',
  })
  @ApiQuery({
    name: 'active',
    required: false,
    example: false,
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    example: true,
  })
  findAll(
    @Query()
    query: CatalogFilterDto
  ) {
    return this.rolesService.findAll(query);
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

  @Get(':id/permission-matrix')
  @ApiOperation({
    summary: 'Obtener matriz RBAC de un rol específico',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del rol',
  })
  @Permissions('IAM', 'ROLES', '444')
  getRolePermissionMatrix(@Param('id') id: string) {
    return this.rolesService.getRolePermissionMatrix(id);
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
    summary: 'Soft Delete de rol',
    description: `
      Realiza eliminación lógica mediante la columna active.

      No elimina registros físicamente.

      Proceso:

      Role
      ↓
      active = false
      ↓
      Audit Log
      ↓
      Permission Cache Rebuild
      ↓
      Usuarios afectados actualizados

      Compatibilidad:
      - 4A.16 Audit Log
      - 4A.17 Historial de Cambios
      - 4A.19 Auditoría de Accesos
      - 4A.20 Observabilidad

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

      Filtros soportados:

      GET ?active=true
      Retorna relaciones activas.

      GET ?active=false
      Retorna relaciones inactivas.

      GET ?includeInactive=true
      Retorna activas e inactivas.

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
  @ApiQuery({
    name: 'active',
    required: false,
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
  })
  getRolePermissions(@Param('id') id: string, @Query() query: CatalogFilterDto) {
    return this.rolesService.getRolePermissions(id, query);
  }

  @Post(':id/permissions')
  @ApiOperation({
    summary: 'Asignar permiso al rol',
    description: `
  Agrega una relación individual Role Permission.

  Role
  ↓
  Role Permissions
  ↓
  Permission Cache Auto-Rebuild
  ↓
  Usuarios afectados actualizados

  Si la relación existe y está inactiva será reactivada.

  Permiso requerido:

  IAM / ROLES / 644
  `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del rol',
  })
  @ApiResponse({
    status: 201,
    description: 'Permiso asignado correctamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Rol, recurso o permiso no encontrado',
  })
  @Permissions('IAM', 'ROLES', '644')
  assignRolePermission(@Param('id') id: string, @Body() dto: AssignRolePermissionDto) {
    return this.rolesService.assignRolePermission(id, dto);
  }

  @Patch(':id/permissions/:resourceId/status')
  @ApiOperation({
    summary: 'Actualizar estado de asignación rol-permiso',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del rol',
  })
  @ApiParam({
    name: 'resourceId',
    description: 'UUID del recurso',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado correctamente',
  })
  @Permissions('IAM', 'ROLES', '777')
  updateRolePermissionStatus(
    @Param('id') id: string,
    @Param('resourceId') resourceId: string,
    @Body() dto: UpdateRolePermissionStatusDto
  ) {
    return this.rolesService.updateRolePermissionStatus(id, resourceId, dto.active);
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

      Filtros soportados:

      GET ?active=true
      Retorna relaciones activas.

      GET ?active=false
      Retorna relaciones inactivas.

      GET ?includeInactive=true
      Retorna activas e inactivas.
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
  @ApiQuery({
    name: 'active',
    required: false,
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
  })
  getRoleModules(@Param('id') id: string, @Query() query: CatalogFilterDto) {
    return this.rolesService.getRoleModules(id, query);
  }

  @Post(':id/modules')
  @ApiOperation({
    summary: 'Asignar módulo al rol',
    description: `
      Agrega una asignación individual entre rol y módulo.

      Role
      ↓
      Role Modules
      ↓
      Permission Cache Auto-Rebuild
      ↓
      Usuarios afectados actualizados

      Si la relación existe inactiva será reactivada.

      Permiso requerido:

      IAM / ROLES / 644
      `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del rol',
  })
  @ApiResponse({
    status: 201,
    description: 'Módulo asignado correctamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Rol o módulo no encontrado',
  })
  @Permissions('IAM', 'ROLES', '644')
  assignRoleModule(@Param('id') id: string, @Body() dto: AssignRoleModuleDto) {
    return this.rolesService.assignRoleModule(id, dto);
  }

  @Patch(':id/modules/:moduleId/status')
  @ApiOperation({
    summary: 'Actualizar estado de asignación rol-módulo',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del rol',
  })
  @ApiParam({
    name: 'moduleId',
    description: 'UUID del módulo',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado correctamente',
  })
  @Permissions('IAM', 'ROLES', '777')
  updateRoleModuleStatus(
    @Param('id') id: string,
    @Param('moduleId') moduleId: string,
    @Body() dto: UpdateRoleModuleStatusDto
  ) {
    return this.rolesService.updateRoleModuleStatus(id, moduleId, dto.active);
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

import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { PermissionsGuard } from '../auth/guards/permission.guard';

import { Permissions } from '../auth/decorators/permission.decorator';

import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleModulesDto } from './dto/update-role-modules.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';

import { UpdateRoleStatusDto } from './dto/update-role-status.dto';

import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Permissions('IAM', 'ROLES', '755')
  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Permissions('IAM', 'ROLES', '444')
  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Permissions('IAM', 'ROLES', '444')
  @Get('permission-matrix')
  permissionMatrix() {
    return this.rolesService.getPermissionMatrix();
  }

  @Permissions('IAM', 'ROLES', '444')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Permissions('IAM', 'ROLES', '644')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Permissions('IAM', 'ROLES', '777')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateRoleStatusDto) {
    return this.rolesService.updateStatus(id, dto.active);
  }

  @Permissions('IAM', 'ROLES', '444')
  @Get(':id/permissions')
  getRolePermissions(@Param('id') id: string) {
    return this.rolesService.getRolePermissions(id);
  }

  @ApiOperation({
    summary: 'Reemplazar matriz completa de permisos del rol',
    description:
      'La lista enviada sustituye completamente la matriz RBAC actual del rol. Los permisos no incluidos serán desactivados.',
  })
  @Permissions('IAM', 'ROLES', '644')
  @Put(':id/permissions')
  updateRolePermissions(@Param('id') id: string, @Body() dto: UpdateRolePermissionsDto) {
    return this.rolesService.updateRolePermissions(id, dto);
  }

  @Permissions('IAM', 'ROLES', '444')
  @Get(':id/modules')
  getRoleModules(@Param('id') id: string) {
    return this.rolesService.getRoleModules(id);
  }

  @ApiOperation({
    summary: 'Reemplazar módulos del rol',
    description:
      'La lista enviada sustituye completamente los módulos asignados al rol. Los módulos no incluidos serán desactivados.',
  })
  @Permissions('IAM', 'ROLES', '644')
  @Put(':id/modules')
  updateRoleModules(@Param('id') id: string, @Body() dto: UpdateRoleModulesDto) {
    return this.rolesService.updateRoleModules(id, dto);
  }
}

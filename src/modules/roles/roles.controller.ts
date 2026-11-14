import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';

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

  @Permissions('IAM', 'ROLES', 'C')
  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Permissions('IAM', 'ROLES', 'R')
  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Permissions('IAM', 'ROLES', 'R')
  @Get('permission-matrix')
  permissionMatrix() {
    return this.rolesService.getPermissionMatrix();
  }

  @Permissions('IAM', 'ROLES', 'R')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Permissions('IAM', 'ROLES', 'U')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Permissions('IAM', 'ROLES', 'U')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateRoleStatusDto) {
    return this.rolesService.updateStatus(id, dto.active);
  }

  @Permissions('IAM', 'ROLES', 'R')
  @Get(':id/permissions')
  getRolePermissions(@Param('id') id: string) {
    return this.rolesService.getRolePermissions(id);
  }

  @Permissions('IAM', 'ROLES', 'U')
  @Put(':id/permissions')
  updateRolePermissions(@Param('id') id: string, @Body() dto: UpdateRolePermissionsDto) {
    return this.rolesService.updateRolePermissions(id, dto);
  }

  @Permissions('IAM', 'ROLES', 'R')
  @Get(':id/modules')
  getRoleModules(@Param('id') id: string) {
    return this.rolesService.getRoleModules(id);
  }

  @Permissions('IAM', 'ROLES', 'U')
  @Put(':id/modules')
  updateRoleModules(@Param('id') id: string, @Body() dto: UpdateRoleModulesDto) {
    return this.rolesService.updateRoleModules(id, dto);
  }
}

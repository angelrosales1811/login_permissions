import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleModulesDto } from './dto/update-role-modules.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';

import { UpdateRoleStatusDto } from './dto/update-role-status.dto';

import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Get('permission-matrix')
  permissionMatrix() {
    return this.rolesService.getPermissionMatrix();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateRoleStatusDto) {
    return this.rolesService.updateStatus(id, dto.active);
  }

  @Get(':id/permissions')
  getRolePermissions(@Param('id') id: string) {
    return this.rolesService.getRolePermissions(id);
  }

  @Put(':id/permissions')
  updateRolePermissions(@Param('id') id: string, @Body() dto: UpdateRolePermissionsDto) {
    return this.rolesService.updateRolePermissions(id, dto);
  }

  @Get(':id/modules')
  getRoleModules(@Param('id') id: string) {
    return this.rolesService.getRoleModules(id);
  }

  @Put(':id/modules')
  updateRoleModules(@Param('id') id: string, @Body() dto: UpdateRoleModulesDto) {
    return this.rolesService.updateRoleModules(id, dto);
  }
}

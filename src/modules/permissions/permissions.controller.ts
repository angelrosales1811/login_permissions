import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { Permissions } from '../auth/decorators/permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permission.guard';

import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionStatusDto } from './dto/update-permission-status.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @Permissions('IAM', 'PERMISSIONS', '755')
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @Permissions('IAM', 'PERMISSIONS', '444')
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  @Permissions('IAM', 'PERMISSIONS', '444')
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('IAM', 'PERMISSIONS', '644')
  update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Patch(':id/status')
  @Permissions('IAM', 'PERMISSIONS', '777')
  updateStatus(@Param('id') id: string, @Body() dto: UpdatePermissionStatusDto) {
    return this.permissionsService.updateStatus(id, dto.active);
  }
}

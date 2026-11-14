import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { ApiOperation } from '@nestjs/swagger';

import { Permissions } from '../auth/decorators/permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permission.guard';

import { ModulesService } from './modules.service';

import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

@Controller('modules')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @ApiOperation({
    summary: 'Crear módulo',
  })
  @Permissions('IAM', 'MODULES', '755')
  @Post()
  create(@Body() dto: CreateModuleDto) {
    return this.modulesService.create(dto);
  }

  @ApiOperation({
    summary: 'Obtener módulos',
  })
  @Permissions('IAM', 'MODULES', '444')
  @Get()
  findAll() {
    return this.modulesService.findAll();
  }

  @ApiOperation({
    summary: 'Obtener módulo por id',
  })
  @Permissions('IAM', 'MODULES', '444')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modulesService.findOne(id);
  }

  @ApiOperation({
    summary: 'Actualizar módulo',
  })
  @Permissions('IAM', 'MODULES', '644')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateModuleDto) {
    return this.modulesService.update(id, dto);
  }

  @ApiOperation({
    summary: 'Cambiar estatus del módulo',
  })
  @Permissions('IAM', 'MODULES', '777')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('active') active: boolean) {
    return this.modulesService.updateStatus(id, active);
  }
}

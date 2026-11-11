import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

import { ModulesService } from './modules.service';

import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @ApiOperation({
    summary: 'Crear módulo',
  })
  @Post()
  create(@Body() dto: CreateModuleDto) {
    return this.modulesService.create(dto);
  }

  @ApiOperation({
    summary: 'Obtener módulos',
  })
  @Get()
  findAll() {
    return this.modulesService.findAll();
  }

  @ApiOperation({
    summary: 'Obtener módulo por id',
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modulesService.findOne(id);
  }

  @ApiOperation({
    summary: 'Actualizar módulo',
  })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateModuleDto) {
    return this.modulesService.update(id, dto);
  }

  @ApiOperation({
    summary: 'Cambiar estatus del módulo',
  })
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('active') active: boolean) {
    return this.modulesService.updateStatus(id, active);
  }
}

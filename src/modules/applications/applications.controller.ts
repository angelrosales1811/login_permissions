import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permission.guard';

import { Permissions } from '../auth/decorators/permission.decorator';

import { ApplicationsService } from './applications.service';

import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@ApiTags('Applications')
@Controller('applications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @Permissions('IAM', 'APPLICATIONS', '755')
  @ApiOperation({
    summary: 'Crear aplicación',
  })
  create(@Body() dto: CreateApplicationDto) {
    return this.applicationsService.create(dto);
  }

  @Get()
  @Permissions('IAM', 'APPLICATIONS', '444')
  @ApiOperation({
    summary: 'Obtener aplicaciones',
  })
  findAll() {
    return this.applicationsService.findAll();
  }

  @Get(':id')
  @Permissions('IAM', 'APPLICATIONS', '444')
  @ApiOperation({
    summary: 'Obtener aplicación por id',
  })
  findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('IAM', 'APPLICATIONS', '644')
  @ApiOperation({
    summary: 'Actualizar aplicación',
  })
  update(@Param('id') id: string, @Body() dto: UpdateApplicationDto) {
    return this.applicationsService.update(id, dto);
  }

  @Patch(':id/status')
  @Permissions('IAM', 'APPLICATIONS', '777')
  @ApiOperation({
    summary: 'Cambiar estatus',
  })
  updateStatus(@Param('id') id: string, @Body('active') active: boolean) {
    return this.applicationsService.updateStatus(id, active);
  }
}

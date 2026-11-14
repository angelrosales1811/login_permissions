import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { Permissions } from '../auth/decorators/permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permission.guard';

import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceStatusDto } from './dto/update-resource-status.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { ResourcesService } from './resources.service';

@Controller('resources')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  @Permissions('IAM', 'RESOURCES', '755')
  create(@Body() createResourceDto: CreateResourceDto) {
    return this.resourcesService.create(createResourceDto);
  }

  @Get()
  @Permissions('IAM', 'RESOURCES', '444')
  findAll() {
    return this.resourcesService.findAll();
  }

  @Get(':id')
  @Permissions('IAM', 'RESOURCES', '444')
  findOne(@Param('id') id: string) {
    return this.resourcesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('IAM', 'RESOURCES', '644')
  update(@Param('id') id: string, @Body() updateResourceDto: UpdateResourceDto) {
    return this.resourcesService.update(id, updateResourceDto);
  }

  @Patch(':id/status')
  @Permissions('IAM', 'RESOURCES', '777')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateResourceStatusDto) {
    return this.resourcesService.updateStatus(id, dto.active);
  }
}

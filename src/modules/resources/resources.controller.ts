import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Permissions } from '../auth/decorators/permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permission.guard';

import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceStatusDto } from './dto/update-resource-status.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { ResourcesService } from './resources.service';

@ApiTags('Resources')
@ApiBearerAuth('JWT-auth')
@Controller('resources')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear recurso',
    description: `
    Crea un nuevo recurso dentro de una aplicación.

    Los recursos representan entidades protegidas por RBAC.

    Ejemplos:

    APPLICATIONS
    MODULES
    RESOURCES
    PERMISSIONS
    ROLES
    USERS

    Flujo RBAC:

    Application
    ↓
    Module
    ↓
    Resource
    ↓
    Role Permission
    ↓
    Permission Cache
    ↓
    JWT

    Permiso requerido:

    IAM / RESOURCES / 755
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Recurso creado correctamente',
  })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes',
  })
  @ApiResponse({
    status: 409,
    description: 'El recurso ya existe',
  })
  @Permissions('IAM', 'RESOURCES', '755')
  create(@Body() createResourceDto: CreateResourceDto) {
    return this.resourcesService.create(createResourceDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar recursos',
    description: `
    Obtiene todos los recursos registrados.

    Utilizado por:

    - Administración IAM
    - Role Permissions
    - Matriz RBAC
    - Permission Cache

    Permiso requerido:

    IAM / RESOURCES / 444
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de recursos obtenido correctamente',
  })
  @Permissions('IAM', 'RESOURCES', '444')
  findAll() {
    return this.resourcesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener recurso por ID',
    description: `
    Consulta el detalle de un recurso específico.

    Incluye:

    - Datos principales
    - Aplicación asociada
    - Estado
    - Auditoría

    Permiso requerido:

    IAM / RESOURCES / 444
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del recurso',
  })
  @ApiResponse({
    status: 200,
    description: 'Recurso encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Recurso no encontrado',
  })
  @Permissions('IAM', 'RESOURCES', '444')
  findOne(@Param('id') id: string) {
    return this.resourcesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar recurso',
    description: `
    Permite modificar la configuración del recurso.

    Puede actualizar:

    - internal_name
    - external_name
    - description
    - application_id

    No modifica permisos asignados.

    Permiso requerido:

    IAM / RESOURCES / 644
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del recurso',
  })
  @ApiResponse({
    status: 200,
    description: 'Recurso actualizado correctamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Recurso no encontrado',
  })
  @Permissions('IAM', 'RESOURCES', '644')
  update(@Param('id') id: string, @Body() updateResourceDto: UpdateResourceDto) {
    return this.resourcesService.update(id, updateResourceDto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Soft Delete de rol',
    description: `
      Realiza eliminación lógica mediante la columna active.

      No elimina registros físicamente.

      Proceso:

      Resource Status
      ↓
      Role Permissions
      ↓
      Permission Cache Invalidate
      ↓
      Permission Cache Rebuild
      ↓
      JWT actualizado

      Permiso requerido:

      IAM / RESOURCES / 777
      `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del recurso',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado correctamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Recurso no encontrado',
  })
  @Permissions('IAM', 'RESOURCES', '777')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateResourceStatusDto) {
    return this.resourcesService.updateStatus(id, dto.active);
  }
}

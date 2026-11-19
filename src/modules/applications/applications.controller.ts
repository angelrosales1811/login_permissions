import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

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

import { ApplicationsService } from './applications.service';

import { CatalogFilterDto } from '../../common/dto/catalog-filter.dto';
import { UpdateStatusDto } from '../../common/dto/update-status.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@ApiTags('Applications')
@ApiBearerAuth('JWT-auth')
@Controller('applications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @Permissions('IAM', 'APPLICATIONS', '755')
  @ApiOperation({
    summary: 'Crear aplicación',
    description: `
    Crea una nueva aplicación dentro de la plataforma.

    Ejemplos:

    IAM
    CRM
    PORTAL

    Las aplicaciones representan el nivel superior del modelo RBAC.

    Jerarquía:

    Application
    ↓
    Module
    ↓
    Resource
    ↓
    Permission
    ↓
    Role
    ↓
    JWT

    Permiso requerido:

    IAM / APPLICATIONS / 755
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Aplicación creada correctamente',
  })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes',
  })
  @ApiResponse({
    status: 409,
    description: 'La aplicación ya existe',
  })
  create(@Body() dto: CreateApplicationDto) {
    return this.applicationsService.create(dto);
  }

  @Get()
  @Permissions('IAM', 'APPLICATIONS', '444')
  @ApiOperation({
    summary: 'Obtener aplicaciones',
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

      Permiso requerido:

      IAM / APPLICATIONS / 444
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de aplicaciones obtenido correctamente',
  })
  @ApiQuery({
    name: 'active',
    required: false,
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
  })
  findAll(
    @Query()
    query: CatalogFilterDto
  ) {
    return this.applicationsService.findAll(query);
  }

  @Get(':id')
  @Permissions('IAM', 'APPLICATIONS', '444')
  @ApiOperation({
    summary: 'Obtener aplicación por ID',
    description: `
    Consulta el detalle de una aplicación específica.

    La información incluye:

    - Código
    - Nombre
    - Ruta
    - Estado
    - Datos de auditoría

    Permiso requerido:

    IAM / APPLICATIONS / 444
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la aplicación',
  })
  @ApiResponse({
    status: 200,
    description: 'Aplicación encontrada',
  })
  @ApiResponse({
    status: 404,
    description: 'Aplicación no encontrada',
  })
  findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('IAM', 'APPLICATIONS', '644')
  @ApiOperation({
    summary: 'Actualizar aplicación',
    description: `
    Permite modificar la configuración funcional de una aplicación.

    Puede actualizar:

    - code
    - name
    - description
    - icon
    - route

    No modifica permisos ni asignaciones RBAC.

    Permiso requerido:

    IAM / APPLICATIONS / 644
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la aplicación',
  })
  @ApiResponse({
    status: 200,
    description: 'Aplicación actualizada correctamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Aplicación no encontrada',
  })
  update(@Param('id') id: string, @Body() dto: UpdateApplicationDto) {
    return this.applicationsService.update(id, dto);
  }

  @Patch(':id/status')
  @Permissions('IAM', 'APPLICATIONS', '777')
  @ApiOperation({
    summary: 'Soft Delete de rol',
    description: `
      Realiza eliminación lógica mediante la columna active.

      No elimina registros físicamente.

      Proceso:

      Application Status
      ↓
      Modules
      ↓
      Resources
      ↓
      Role Permissions
      ↓
      Permission Cache
      ↓
      JWT

      Los cambios provocan invalidación y reconstrucción del permission cache.

      Permiso requerido:

      IAM / APPLICATIONS / 777
      `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la aplicación',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado correctamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Aplicación no encontrada',
  })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.applicationsService.updateStatus(id, dto.active);
  }
}

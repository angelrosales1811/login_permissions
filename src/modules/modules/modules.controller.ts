import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Permissions } from '../auth/decorators/permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permission.guard';

import { ModulesService } from './modules.service';

import { UpdateStatusDto } from '../../common/dto/update-status.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

@ApiTags('Modules')
@ApiBearerAuth('JWT-auth')
@Controller('modules')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear módulo',
    description: `
    Crea un nuevo módulo funcional dentro de una aplicación.

    Ejemplos:

    IAM
    USERS
    ROLES
    PERMISSIONS
    AUDIT

    Los módulos son utilizados para:

    - Menú dinámico
    - Matriz RBAC
    - Organización funcional
    - Control de acceso

    Permiso requerido:

    IAM / MODULES / 755
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Módulo creado correctamente',
  })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes',
  })
  @ApiResponse({
    status: 409,
    description: 'El módulo ya existe',
  })
  @Permissions('IAM', 'MODULES', '755')
  create(@Body() dto: CreateModuleDto) {
    return this.modulesService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener módulos',
    description: `
    Obtiene el catálogo completo de módulos registrados.

    Utilizado por:

    - Menú dinámico
    - Administración IAM
    - Matriz RBAC
    - Role Modules

    Permiso requerido:

    IAM / MODULES / 444
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de módulos obtenido correctamente',
  })
  @Permissions('IAM', 'MODULES', '444')
  findAll() {
    return this.modulesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener módulo por ID',
    description: `
    Consulta el detalle de un módulo específico.

    La información incluye:

    - Identificador
    - Aplicación asociada
    - Estado
    - Auditoría

    Permiso requerido:

    IAM / MODULES / 444
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del módulo',
  })
  @ApiResponse({
    status: 200,
    description: 'Módulo encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Módulo no encontrado',
  })
  @Permissions('IAM', 'MODULES', '444')
  findOne(@Param('id') id: string) {
    return this.modulesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar módulo',
    description: `
    Permite modificar la configuración del módulo.

    Puede actualizar:

    - Nombre interno
    - Nombre externo
    - Descripción
    - Configuración funcional

    No modifica permisos ni asignaciones RBAC.

    Permiso requerido:

    IAM / MODULES / 644
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del módulo',
  })
  @ApiResponse({
    status: 200,
    description: 'Módulo actualizado correctamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Módulo no encontrado',
  })
  @Permissions('IAM', 'MODULES', '644')
  update(@Param('id') id: string, @Body() dto: UpdateModuleDto) {
    return this.modulesService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Soft Delete de rol',
    description: `
      Realiza eliminación lógica mediante la columna active.

      No elimina registros físicamente.

      Proceso:

      Module Status
      ↓
      Role Modules
      ↓
      Permission Cache Auto-Rebuild
      ↓
      Menús dinámicos
      ↓
      Disponibilidad funcional

      Permiso requerido:

      IAM / MODULES / 777
      `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del módulo',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado correctamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Módulo no encontrado',
  })
  @Permissions('IAM', 'MODULES', '777')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.modulesService.updateStatus(id, dto.active);
  }
}

import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Permissions } from '../auth/decorators/permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permission.guard';

import { CatalogFilterDto } from '../../common/dto/catalog-filter.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionStatusDto } from './dto/update-permission-status.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionsService } from './permissions.service';

@ApiTags('Permissions')
@ApiBearerAuth('JWT-auth')
@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear permiso',
    description: `
      Crea un nuevo permiso dentro del catálogo IAM.

      Ejemplos:

      444 = Solo lectura
      644 = Lectura escritura
      755 = Avanzado
      777 = Administrador

      Requiere permiso:

      IAM / PERMISSIONS / 755
      `,
  })
  @ApiResponse({
    status: 201,
    description: 'Permiso creado correctamente',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un permiso con ese código',
  })
  @Permissions('IAM', 'PERMISSIONS', '755')
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar permisos',
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
      `,
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de permisos',
  })
  @Permissions('IAM', 'PERMISSIONS', '444')
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
    return this.permissionsService.findAll(query);
  }

  @Get('cache-health')
  @ApiOperation({
    summary: 'Health Check del Permission Cache',
    description: `
      Verifica la integridad general del permission cache.

      Indicadores:

      - totalUsers
      - usersWithCache
      - usersWithoutCache

      Utilizado para monitoreo RBAC.
      `,
  })
  @ApiResponse({
    status: 200,
    description: 'Estado general del cache',
    schema: {
      example: {
        totalUsers: 10,
        usersWithCache: 10,
        usersWithoutCache: 0,
      },
    },
  })
  @Permissions('IAM', 'PERMISSIONS', '444')
  cacheHealth() {
    return this.permissionsService.cacheHealth();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener permiso por ID',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del permiso',
  })
  @ApiResponse({
    status: 200,
    description: 'Permiso encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Permiso no encontrado',
  })
  @Permissions('IAM', 'PERMISSIONS', '444')
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar permiso',
    description: `
      Actualiza nombre, descripción o propiedades del permiso.

      No modifica asignaciones RBAC existentes.
      `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del permiso',
  })
  @ApiResponse({
    status: 200,
    description: 'Permiso actualizado',
  })
  @Permissions('IAM', 'PERMISSIONS', '644')
  update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Activar o desactivar permiso',
    description: `
      Permite cambiar el estado lógico del permiso.

      Impacto:

      Permissions
      ↓
      Trigger DB
      ↓
      Invalidate Cache
      ↓
      Rebuild automático
      ↓
      JWT actualizado
      `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del permiso',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado',
  })
  @Permissions('IAM', 'PERMISSIONS', '777')
  updateStatus(@Param('id') id: string, @Body() dto: UpdatePermissionStatusDto) {
    return this.permissionsService.updateStatus(id, dto.active);
  }

  @Post('cache/rebuild-user/:userId')
  @ApiOperation({
    summary: 'Reconstruir cache RBAC de un usuario',
    description: `
      Reconstruye completamente el permission_cache de un usuario.

      Proceso:

      UserRoles
      ↓
      RolePermissions
      ↓
      Permission Cache
      ↓
      Rebuild

      Utilizado para:

      - Recuperación
      - Diagnóstico
      - Soporte IAM

      No requiere que el usuario vuelva a autenticarse.
    `,
  })
  @ApiParam({
    name: 'userId',
    description: 'UUID del usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache reconstruido correctamente',
    schema: {
      example: {
        userId: 'abc97121-c050-4bbe-a6e1-b39ccb68da0b',
        rebuilt: 2,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  @Permissions('IAM', 'PERMISSIONS', '777')
  rebuildUserCache(
    @Param('userId')
    userId: string
  ) {
    return this.permissionsService.rebuildUserCache(userId);
  }

  @Post('cache/rebuild-all')
  @ApiOperation({
    summary: 'Soft Delete de rol',
    description: `
      Realiza eliminación lógica mediante la columna active.

      No elimina registros físicamente.

      Proceso:

      Usuarios activos
      ↓
      Roles
      ↓
      Permisos
      ↓
      Permission Cache

      Uso recomendado:

      - Deploys
      - Recuperación masiva
      - Diagnóstico

      Puede tardar dependiendo de la cantidad de usuarios.
      `,
  })
  @ApiResponse({
    status: 200,
    description: 'Reconstrucción masiva completada',
    schema: {
      example: {
        processed: 125,
      },
    },
  })
  @Permissions('IAM', 'PERMISSIONS', '777')
  rebuildAllCaches() {
    return this.permissionsService.rebuildAllCaches();
  }
}

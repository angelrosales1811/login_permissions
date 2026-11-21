import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CatalogFilterDto } from '../../common/dto/catalog-filter.dto';

import { NavigationService } from './navigation.service';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permission.guard';

import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

import { UpdateStatusDto } from '../../common/dto/update-status.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { CreateMenuPermissionDto } from './dto/create-menu-permission.dto';
import { NavigationExportQueryDto } from './dto/navigation-export-query.dto';
import { NavigationHistoryQueryDto } from './dto/navigation-history-query.dto';
import { ReorderMenuItemDto } from './dto/reorder-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { UpdateMenuPermissionsDto } from './dto/update-menu-permissions.dto';

@ApiTags('Navigation')
@Controller('navigation')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  @Post('menus')
  @Permissions('IAM', 'NAVIGATION', '755')
  @ApiOperation({
    summary: 'Crear menú',
    description: `
      Crea un nuevo menú navegable.

      Compatible con:
      - Menu Items
      - Menu Permissions
      - My Menu

      Fase 1 Navegación Dinámica.
      `,
  })
  @ApiResponse({
    status: 201,
    description: 'Menú creado correctamente',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un menú con el mismo nombre o displayOrder para la aplicación',
  })
  createMenu(@Body() dto: CreateMenuDto) {
    return this.navigationService.createMenu(dto);
  }

  @Get('menus')
  @Permissions('IAM', 'NAVIGATION', '444')
  @ApiOperation({
    summary: 'Listar menús',
    description: `
    Por defecto retorna únicamente registros activos.

    Filtros:

    GET ?active=true

    GET ?active=false

    GET ?includeInactive=true

    Utilizado para:

    - Soft Delete
    - Reactivación
    - Auditoría
    - Administración de Navegación

    Permiso requerido:

    IAM / NAVIGATION / 444
  `,
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de menús obtenido correctamente',
  })
  @ApiQuery({
    name: 'active',
    required: false,
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
  })
  findMenus(
    @Query()
    query: CatalogFilterDto
  ) {
    return this.navigationService.findMenus(query);
  }

  @Get('menus/:id')
  @Permissions('IAM', 'NAVIGATION', '444')
  @ApiParam({
    name: 'id',
    description: 'UUID del menú',
  })
  @ApiResponse({
    status: 200,
    description: 'Menú encontrado',
  })
  findMenuById(@Param('id', ParseUUIDPipe) id: string) {
    return this.navigationService.findMenuById(id);
  }

  @Patch('menus/:id')
  @Permissions('IAM', 'NAVIGATION', '644')
  @ApiOperation({
    summary: 'Actualizar menú',
  })
  @ApiResponse({
    status: 200,
    description: 'Menú actualizado',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto de displayOrder dentro de la aplicación',
  })
  updateMenu(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMenuDto) {
    return this.navigationService.updateMenu(id, dto);
  }

  @Patch('menus/:id/status')
  @Permissions('IAM', 'NAVIGATION', '777')
  @ApiOperation({
    summary: 'Actualizar estado de menú',
    description: `
    Realiza eliminación lógica mediante la columna active.

    No elimina registros físicamente.

    Permite:
    - Desactivar menú
    - Reactivar menú

    Compatible con:
    - Menu Items
    - Menu Permissions
    - My Menu

    Permiso requerido:

    IAM / NAVIGATION / 777
  `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del menú',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado correctamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Menú no encontrado',
  })
  updateMenuStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStatusDto) {
    return this.navigationService.updateMenuStatus(id, dto.active);
  }

  @Get('my-menu')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener menú dinámico del usuario',
    description: `
      Genera el menú visible para el usuario autenticado.

      Flujo:

      JWT
      ↓
      Roles
      ↓
      Permission Cache
      ↓
      Role Modules
      ↓
      Navigation
      ↓
      Menú final

      Sólo devuelve opciones autorizadas para el usuario.
      `,
  })
  @ApiResponse({
    status: 200,
    description: 'Menú generado correctamente',
    schema: {
      example: [
        {
          application: 'IAM',
          module: 'USERS',
          label: 'Usuarios',
          route: '/iam/users',
        },
        {
          application: 'IAM',
          module: 'ROLES',
          label: 'Roles',
          route: '/iam/roles',
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'JWT inválido o expirado',
  })
  @UseGuards(JwtAuthGuard)
  async getMyMenu(@CurrentUser() user: AuthUser) {
    return this.navigationService.getMenusByUser(user.id);
  }

  @Get('user/:userId/menu')
  @Permissions('IAM', 'NAVIGATION', '444')
  @ApiOperation({
    summary: 'Simulación administrativa por usuario',
    description: 'Permite visualizar exactamente el menú calculado para cualquier usuario.',
  })
  @ApiParam({
    name: 'userId',
    description: 'UUID del usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'Menú calculado correctamente',
  })
  getUserMenu(
    @Param('userId', ParseUUIDPipe)
    userId: string
  ) {
    return this.navigationService.getMenuSimulationByUser(userId);
  }

  @Get('role/:roleId/menu')
  @Permissions('IAM', 'NAVIGATION', '444')
  @ApiOperation({
    summary: 'Simulación administrativa por rol',
  })
  @ApiParam({
    name: 'roleId',
    description: 'UUID del rol',
  })
  @ApiResponse({
    status: 200,
    description: 'Menú calculado para el rol',
  })
  getRoleMenu(
    @Param('roleId', ParseUUIDPipe)
    roleId: string
  ) {
    return this.navigationService.getMenuSimulationByRole(roleId);
  }

  @Get('history')
  @Permissions('IAM', 'NAVIGATION', '444')
  @ApiOperation({
    summary: 'Historial de navegación',
  })
  @ApiQuery({
    name: 'action',
    required: false,
  })
  @ApiQuery({
    name: 'page',
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
  })
  getNavigationHistory(
    @Query()
    query: NavigationHistoryQueryDto
  ) {
    return this.navigationService.getNavigationHistory(query);
  }

  @Get('export')
  @Permissions('IAM', 'NAVIGATION', '444')
  @ApiOperation({
    summary: 'Exportar configuración de navegación',
  })
  @ApiQuery({
    name: 'format',
    enum: ['json', 'csv'],
    required: false,
  })
  exportNavigation(
    @Query()
    query: NavigationExportQueryDto
  ) {
    return this.navigationService.exportNavigation(query.format ?? 'json');
  }

  /////////////////////////////

  @Post('menu-items')
  @Permissions('IAM', 'NAVIGATION', '755')
  @ApiOperation({
    summary: 'Crear Menu Item',
  })
  @ApiResponse({
    status: 201,
    description: 'Menu Item creado correctamente',
  })
  createMenuItem(
    @Body()
    dto: CreateMenuItemDto
  ) {
    return this.navigationService.createMenuItem(dto);
  }

  @Post('menu-permissions')
  @Permissions('IAM', 'NAVIGATION', '755')
  @ApiOperation({
    summary: 'Asignar permiso a Menu Item',
  })
  createMenuPermission(
    @Body()
    dto: CreateMenuPermissionDto
  ) {
    return this.navigationService.assignMenuPermission(dto);
  }

  @Get('menu-items/:id/permissions')
  @Permissions('IAM', 'NAVIGATION', '444')
  @ApiOperation({
    summary: 'Obtener permisos asociados a Menu Item',
  })
  findMenuItemPermissions(
    @Param('id', ParseUUIDPipe)
    id: string
  ) {
    return this.navigationService.findMenuItemPermissions(id);
  }

  @Get('menus/:id/items')
  @Permissions('IAM', 'NAVIGATION', '444')
  @ApiOperation({
    summary: 'Listar items del menú',
  })
  findMenuItems(
    @Param('id', ParseUUIDPipe)
    id: string
  ) {
    return this.navigationService.findMenuItems(id);
  }

  ///////////////////To Do @Get('menu-items/:id')
  @Get('menu-items/:id')
  @Permissions('IAM', 'NAVIGATION', '444')
  @ApiParam({
    name: 'id',
    description: 'UUID del menúItem',
  })
  @ApiResponse({
    status: 200,
    description: 'menúItem encontrado',
  })
  findMenuItemById(@Param('id', ParseUUIDPipe) id: string) {
    return this.navigationService.findMenuItemById(id);
  }

  ///////////////////To Do @Patch('menu-items/:id')
  @Patch('menu-items/:id')
  @Permissions('IAM', 'NAVIGATION', '644')
  @ApiOperation({
    summary: 'Actualizar Menu Item',
  })
  @ApiResponse({
    status: 200,
    description: 'Menu Item actualizado',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto de displayOrder dentro del menú',
  })
  updateMenuItem(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMenuItemDto) {
    return this.navigationService.updateMenuItem(id, dto);
  }
  ///////////////////To Do @Patch('menu-items/:id/order')
  @Patch('menu-items/:id/order')
  @Permissions('IAM', 'NAVIGATION', '644')
  @ApiOperation({
    summary: 'Reordenar Menu Item',
  })
  @ApiResponse({
    status: 200,
    description: 'Orden actualizado correctamente',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un Menu Item con ese displayOrder',
  })
  reorderMenuItem(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReorderMenuItemDto) {
    return this.navigationService.reorderMenuItem(id, dto);
  }

  @Patch('menu-items/:id/status')
  @Permissions('IAM', 'NAVIGATION', '777')
  @ApiOperation({
    summary: 'Actualizar estado de Menu Item',
    description: `
    Realiza eliminación lógica mediante la columna active.

    Permite:

    - Desactivar Menu Item
    - Reactivar Menu Item

    No elimina registros físicamente.

    Permiso requerido:

    IAM / NAVIGATION / 777
  `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del Menu Item',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado correctamente',
  })
  updateMenuItemStatus(
    @Param('id', ParseUUIDPipe)
    id: string,
    @Body()
    dto: UpdateStatusDto
  ) {
    return this.navigationService.updateMenuItemStatus(id, dto.active);
  }

  @Put('menu-items/:id/permissions')
  @Permissions('IAM', 'NAVIGATION', '644')
  @ApiOperation({
    summary: 'Reemplazar permisos de Menu Item',
  })
  replaceMenuPermissions(
    @Param('id', ParseUUIDPipe)
    id: string,
    @Body()
    dto: UpdateMenuPermissionsDto
  ) {
    return this.navigationService.replaceMenuPermissions(id, dto);
  }

  @Patch('menu-permissions/:id/status')
  @Permissions('IAM', 'NAVIGATION', '777')
  @ApiOperation({
    summary: 'Actualizar estado de Menu Permission',
    description: `
    Realiza eliminación lógica mediante la columna active.

    Permite:

    - Desactivar Menu Permission
    - Reactivar Menu Permission

    No elimina registros físicamente.

    Permiso requerido:

    IAM / NAVIGATION / 777
  `,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del Menu Permission',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado correctamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Menu Permission no encontrado',
  })
  updateMenuPermissionStatus(
    @Param('id', ParseUUIDPipe)
    id: string,
    @Body()
    dto: UpdateStatusDto
  ) {
    return this.navigationService.updateMenuPermissionStatus(id, dto.active);
  }
}

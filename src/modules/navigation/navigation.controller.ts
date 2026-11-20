import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { NavigationService } from './navigation.service';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permission.guard';

import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { ReorderMenuItemDto } from './dto/reorder-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

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
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de menús',
  })
  findMenus(@Query('active') active?: string) {
    return this.navigationService.findMenus(active !== 'false');
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

  @Patch('menus/:id/deactivate')
  @Permissions('IAM', 'NAVIGATION', '777')
  @ApiOperation({
    summary: 'Desactivar menú',
  })
  @ApiResponse({
    status: 200,
    description: 'Menú desactivado',
  })
  deactivateMenu(@Param('id', ParseUUIDPipe) id: string) {
    return this.navigationService.deactivateMenu(id);
  }

  @Patch('menus/:id/reactivate')
  @Permissions('IAM', 'NAVIGATION', '777')
  @ApiOperation({
    summary: 'Reactivar menú',
  })
  @ApiResponse({
    status: 200,
    description: 'Menú reactivado',
  })
  reactivateMenu(@Param('id', ParseUUIDPipe) id: string) {
    return this.navigationService.reactivateMenu(id);
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
  ///////////////////To Do @Patch('menu-items/:id/deactivate',)
  @Patch('menu-items/:id/deactivate')
  @Permissions('IAM', 'NAVIGATION', '777')
  @ApiOperation({
    summary: 'Desactivar Menu Item',
  })
  @ApiResponse({
    status: 200,
    description: 'Menu Item desactivado',
  })
  deactivateMenuItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.navigationService.deactivateMenuItem(id);
  }
  ///////////////////To Do @Patch('menu-items/:id/reactivate',)
  @Patch('menu-items/:id/reactivate')
  @Permissions('IAM', 'NAVIGATION', '777')
  @ApiOperation({
    summary: 'Reactivar Menu Item',
  })
  @ApiResponse({
    status: 200,
    description: 'Menu Item reactivado',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto de displayOrder dentro del menú',
  })
  reactivateMenuItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.navigationService.reactivateMenuItem(id);
  }
}

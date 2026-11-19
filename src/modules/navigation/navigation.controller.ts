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
}

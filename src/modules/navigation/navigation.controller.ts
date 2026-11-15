import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreateNavigationDto } from './dto/create-navigation.dto';
import { UpdateNavigationDto } from './dto/update-navigation.dto';
import { NavigationService } from './navigation.service';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/interfaces/auth-user.interface';

@ApiTags('Navigation')
@Controller('navigation')
export class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear elemento de navegación',
    description: `
    Crea un nuevo registro de navegación.

    Utilizado para construir:

    - Menús
    - Submenús
    - Accesos dinámicos

    Base futura para navegación RBAC.
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Elemento de navegación creado correctamente',
  })
  create(@Body() createNavigationDto: CreateNavigationDto) {
    return this.navigationService.create(createNavigationDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar navegación',
    description: `
    Obtiene todos los registros de navegación.

    Utilizado para:

    - Administración de menú
    - Configuración de navegación
    - Diagnóstico
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de navegación obtenido correctamente',
  })
  findAll() {
    return this.navigationService.findAll();
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

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar elemento de navegación',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador del registro de navegación',
  })
  @ApiResponse({
    status: 200,
    description: 'Elemento encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Elemento no encontrado',
  })
  findOne(@Param('id') id: string) {
    return this.navigationService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar elemento de navegación',
    description: `
    Permite modificar propiedades de navegación:

    - Nombre
    - Ruta
    - Orden
    - Visibilidad
    - Configuración visual

    No modifica permisos RBAC.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador del registro',
  })
  @ApiResponse({
    status: 200,
    description: 'Elemento actualizado correctamente',
  })
  update(@Param('id') id: string, @Body() updateNavigationDto: UpdateNavigationDto) {
    return this.navigationService.update(+id, updateNavigationDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar elemento de navegación',
    description: `
    Elimina un registro del sistema de navegación.

    Impacto:

    Navigation
    ↓
    Menús disponibles
    ↓
    Interfaz del usuario

    Utilizar únicamente para limpieza administrativa.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador del registro',
  })
  @ApiResponse({
    status: 200,
    description: 'Elemento eliminado correctamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Elemento no encontrado',
  })
  remove(@Param('id') id: string) {
    return this.navigationService.remove(+id);
  }
}

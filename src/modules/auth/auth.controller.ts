import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';

import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthUser } from './interfaces/auth-user.interface';

import { CurrentUser } from './decorators/current-user.decorator';
import { LogoutResponseDto } from './dto/logout-response.dto';
import { MeResponseDto } from './dto/me-response.dto';
import { RefreshResponseDto } from './dto/refresh-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autenticar usuario',
    description:
      'Valida las credenciales del usuario y genera un JWT para consumir los endpoints protegidos de la API.',
  })
  @ApiBody({
    type: LoginDto,
    description: 'Credenciales de acceso del usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'Autenticación exitosa',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Solicitud inválida. Error de validación en email o password.',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas.',
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor.',
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener usuario autenticado',
    description:
      'Devuelve la información básica del usuario asociada al JWT enviado en la petición.',
  })
  @ApiResponse({
    status: 200,
    description: 'Información del usuario autenticado',
    type: MeResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido o expirado',
  })
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renovar Access Token',
    description:
      'Recibe un Refresh Token válido y genera un nuevo Access Token junto con un nuevo Refresh Token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token renovado correctamente',
    type: RefreshResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh Token inválido o expirado',
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
  })
  refresh(
    @Body()
    dto: RefreshTokenDto
  ) {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cerrar sesión',
    description:
      'Cierra la sesión activa del usuario autenticado, marca la sesión como inactiva y revoca todos los Refresh Tokens vigentes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sesión cerrada correctamente',
    type: LogoutResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido o expirado',
  })
  logout(@CurrentUser() user: AuthUser) {
    return this.authService.logout(user.id);
  }
}

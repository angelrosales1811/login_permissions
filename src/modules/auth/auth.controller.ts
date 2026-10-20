import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';

import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthUser } from './interfaces/auth-user.interface';

import { CurrentUser } from './decorators/current-user.decorator';
import { MeResponseDto } from './dto/me-response.dto';

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
  })
  @ApiResponse({
    status: 200,
    description: 'Nuevo JWT generado',
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
  logout(@CurrentUser() user: AuthUser) {
    return this.authService.logout(user.id);
  }
}

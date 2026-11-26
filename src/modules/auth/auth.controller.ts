import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  // ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthUser } from './interfaces/auth-user.interface';

import { CurrentUser } from './decorators/current-user.decorator';
import { LogoutResponseDto } from './dto/logout-response.dto';

import { OAuthUrlResponseDto } from './dto/oauth-url-response.dto';
//import { SocialLoginResponseDto } from './dto/social-login-response.dto';

import { GoogleCallbackResponseDto } from './dto/google-callback-response.dto';
import { GoogleCallbackDto } from './dto/google-callback.dto';
import { TokenIntrospectionDto } from './dto/token-introspection.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @ApiOperation({
    summary: 'Iniciar autenticación Google',
    description: `
      Genera una URL OAuth de Google utilizando Supabase.

      Flujo:

      Google OAuth
      ↓
      Frontend
      ↓
      GET /auth/google
      ↓
      Google Login
      ↓
      POST /auth/google/callback
      ↓
      JWT Plataforma

      No requiere autenticación previa.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'URL OAuth generada correctamente',
    type: OAuthUrlResponseDto,
  })
  getGoogleAuthUrl() {
    return this.authService.getGoogleAuthUrl();
  }

  @Post('google/callback')
  @ApiOperation({
    summary: 'Procesar callback Google OAuth',
    description: `
      Recibe el access token entregado por Google a través de Supabase.

      Responsabilidades:

      - Crear perfil si no existe
      - Asignar rol Guest inicial
      - Generar Permission Cache
      - Generar JWT
      - Crear sesión

      No requiere JWT previo.
      `,
  })
  @ApiBody({
    schema: {
      example: {
        accessToken: 'eyJhbGciOi...',
      },
    },
  })
  @ApiResponse({
    status: 200,
    type: GoogleCallbackResponseDto,
  })
  googleCallback(
    @Body()
    dto: GoogleCallbackDto
  ) {
    return this.authService.googleCallback(dto.accessToken);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autenticar usuario',
    description: `
      Autentica un usuario utilizando credenciales almacenadas en Supabase.

      El proceso realiza:

      1. Validación de credenciales
      2. Obtención de Permission Cache
      3. Recuperación automática del cache si fue eliminado
      4. Generación de JWT
      5. Generación de Refresh Token
      6. Creación de sesión

      RBAC:
      Los permisos incluidos en el JWT provienen de permission_cache.
      `,
  })
  @ApiBody({
    description: 'Credenciales de acceso',
    schema: {
      example: {
        email: 'admin@crm.com',
        password: 'Password123',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Autenticación exitosa',
    schema: {
      example: {
        accessToken: 'jwt-token',
        refreshToken: 'refresh-token',
        user: {
          uid: 'ad07de09-1a68-4cc2-a944-75a555433beb',
          email: 'admin@crm.com',
        },
      },
    },
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
    description: `
      Retorna la información contenida en el JWT activo.

      Incluye:

      - Perfil
      - Roles
      - Permisos RBAC
      - SessionId

      Utilizado para validar autenticación y autorización.
      `,
  })
  @ApiResponse({
    status: 200,
    description: 'Información del usuario autenticado',
    schema: {
      example: {
        id: 'abc97121-c050-4bbe-a6e1-b39ccb68da0b',
        uid: 'ad07de09-1a68-4cc2-a944-75a555433beb',
        email: 'admin@crm.com',
        fullName: 'Administrador Sistema',
        sessionId: '28c9b618-e4e8-492a-8070-abb5540e394b',
        roles: ['ADMINISTRATOR', 'IAM_ADMIN'],
        permissions: {
          IAM: {
            PERMISSIONS: ['444'],
            IAM_USERS: ['810'],
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido o expirado',
  })
  async me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renovar Access Token',
    description: `
      Renueva el Access Token utilizando un Refresh Token válido.

      El nuevo JWT conserva:

      - Roles
      - Permisos RBAC
      - SessionId

      La sesión debe permanecer activa.

`,
  })
  @ApiBody({
    schema: {
      example: {
        refreshToken: 'eyJhbGciOi...',
      },
    },
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        accessToken: 'new-jwt',
        refreshToken: 'new-refresh-token',
      },
    },
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

  @Post('token/introspect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validar JWT en línea',
    description: `
      Valida un JWT emitido por IAM.

      Verificaciones:

      - Firma JWT
      - Expiración
      - Usuario activo
      - Sesión activa

      Diseñado para:

      - API Gateway
      - Zero Trust
      - Microservicios
      - Integraciones externas
      `,
  })
  @ApiBody({
    type: TokenIntrospectionDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Token validado correctamente',
    schema: {
      example: {
        active: true,
        userId: 'abc97121-c050-4bbe-a6e1-b39ccb68da0b',
        email: 'admin@crm.com',
        roles: ['IAM_ADMIN', 'ADMINISTRADOR'],
        sessionId: '28c9b618-e4e8-492a-8070-abb5540e394b',
        exp: 1778000000,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido',
  })
  introspectToken(
    @Body()
    dto: TokenIntrospectionDto
  ) {
    return this.authService.introspectToken(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cerrar sesión',
    description: `
      Cierra la sesión actual.

      Acciones realizadas:

      - Marca UserSession como inactiva
      - Revoca Refresh Tokens asociados
      - Registra evento de auditoría

      Requiere JWT.
      
      `,
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
    return this.authService.logout(user.id, user.sessionId);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cerrar todas las sesiones',
    description: `
      Revoca todas las sesiones activas del usuario.

      Acciones:

      - Cierra todas las UserSessions activas
      - Revoca todos los Refresh Tokens
      - Registra auditoría

      Útil para recuperación de cuenta o cierre global.
      
      `,
  })
  logoutAll(@CurrentUser() user: AuthUser) {
    return this.authService.logoutAll(user.id);
  }
}

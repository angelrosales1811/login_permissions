import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';

import { Request, Response } from 'express';

import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';

@ApiTags('Home')
@Controller()
export class HomeController {
  @Get()
  @ApiOperation({
    summary: 'Página principal',
    description:
      'Muestra la página de bienvenida de la API y accesos directos a Swagger y OpenAPI.',
  })
  @ApiResponse({
    status: 200,
    description: 'Página principal cargada correctamente.',
  })
  home(@Res() res: Response): void {
    res.send(`
<!DOCTYPE html>
<html>

<head>
  <meta charset="UTF-8">
  <title>Security RBAC API</title>

  <style>
    body {
      margin: 0;
      padding: 0;
      background: #0f172a;
      color: white;
      font-family: Arial, sans-serif;
    }

    .container {
      max-width: 1200px;
      margin: auto;
      padding: 60px 20px;
    }

    h1 {
      font-size: 48px;
      margin-bottom: 10px;
    }

    p {
      color: #cbd5e1;
      font-size: 18px;
    }

    .badge {
      display: inline-block;
      background: #1e293b;
      padding: 6px 12px;
      border-radius: 999px;
      margin: 5px;
      font-size: 12px;
      font-weight: bold;
    }

    .links {
      margin-top: 40px;
    }

    .link {
      display: inline-block;
      margin-right: 15px;
      padding: 12px 20px;
      border-radius: 8px;
      text-decoration: none;
      color: white;
      background: #2563eb;
    }

    .link:hover {
      background: #1d4ed8;
    }
  </style>
</head>

<body>

<div class="container">

  <h1>Security RBAC API</h1>

  <p>
    Enterprise Identity & Access Management Platform
  </p>

  <div>
    <span class="badge">NestJS 11</span>
    <span class="badge">JWT</span>
    <span class="badge">RBAC</span>
    <span class="badge">TypeORM</span>
    <span class="badge">PostgreSQL</span>
    <span class="badge">Supabase</span>
    <span class="badge">Swagger</span>
    <span class="badge">OpenAPI 3</span>
  </div>

  <div class="links">
    <a class="link" href="/api/v1/docs">
      Swagger Docs
    </a>

    <a class="link" href="/api/v1/docs/json">
      OpenAPI JSON
    </a>
  </div>

</div>

</body>

</html>
`);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Perfil desde JWT',
    description:
      'Obtiene la información del usuario autenticado a partir del token JWT enviado en la cabecera Authorization.',
  })
  @ApiResponse({
    status: 200,
    description: 'Información del usuario autenticado.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token inválido o expirado.',
  })
  profile(@Req() req: Request) {
    return req.user;
  }
}

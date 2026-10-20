import { Controller, Get, Res } from '@nestjs/common';

import { Response } from 'express';

import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { getSwaggerDocument } from './swagger.document';

@ApiTags('Docs')
@Controller('docs')
export class DocsController {
  @Get('json')
  @ApiOperation({
    summary: 'OpenAPI JSON',
    description:
      'Devuelve el documento OpenAPI 3.0 generado automáticamente por Swagger para integraciones, generación de SDKs y herramientas externas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Documento OpenAPI generado correctamente.',
  })
  getSwaggerJson() {
    return getSwaggerDocument();
  }

  @Get()
  @ApiOperation({
    summary: 'Swagger UI',
    description: 'Muestra la interfaz interactiva de documentación de la API basada en Swagger UI.',
  })
  @ApiResponse({
    status: 200,
    description: 'Interfaz Swagger UI cargada correctamente.',
  })
  getDocs(@Res() res: Response): void {
    res.send(`
<!DOCTYPE html>
<html>

<head>
  <meta charset="UTF-8" />
  <title>
    Security RBAC API | NestJS + PostgreSQL + JWT
  </title>

  <link
    rel="stylesheet"
    href="https://unpkg.com/swagger-ui-dist/swagger-ui.css"
  />

  <style>
    body {
      margin: 0;
      background: #f4f4f5;
    }

    .header {
      background: #0f172a;
      color: white;
      padding: 20px;
    }

    .container {
      max-width: 1400px;
      margin: auto;
    }

    .header h1 {
      margin: 0;
      font-size: 32px;
    }

    .header p {
      opacity: 0.85;
      margin-top: 8px;
    }

    .links {
      margin-top: 16px;
    }

    .links a {
      color: #38bdf8;
      margin-right: 20px;
      text-decoration: none;
      font-weight: 600;
    }

    .links a:hover {
      text-decoration: underline;
    }
  </style>
</head>

<body>

<div class="header">
  <div class="container">

    <h1>Security RBAC API</h1>

    <p>
      NestJS 11 · PostgreSQL · TypeORM · JWT · RBAC · Supabase
    </p>

    <div class="links">
      <a
        href="https://github.com/angelrosales1811"
        target="_blank"
        rel="noopener noreferrer"
      >
        GitHub Repository
      </a>

      <a href="/api/v1/docs/json">
        OpenAPI JSON
      </a>
    </div>

  </div>
</div>

<div id="swagger-ui"></div>

<script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>

<script src="https://unpkg.com/swagger-ui-dist/swagger-ui-standalone-preset.js"></script>

<script>
window.onload = () => {
  SwaggerUIBundle({
    url: window.location.origin + '/api/v1/docs/json',
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    layout: 'StandaloneLayout'
  });
};
</script>

</body>

</html>
`);
  }
}

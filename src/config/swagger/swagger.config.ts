import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle(process.env.SWAGGER_TITLE || 'Security RBAC API')
  .setDescription(process.env.SWAGGER_DESCRIPTION || 'Centralized IAM Platform')
  .setVersion(process.env.SWAGGER_VERSION || '1.0')
  .addBearerAuth()
  .build();

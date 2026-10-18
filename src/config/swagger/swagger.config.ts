import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Security RBAC API')
  .setDescription(
    `
Enterprise Identity and Access Management Platform.

Features:
• JWT Authentication
• Role-Based Access Control (RBAC)
• Multi Application Support
• Roles & Permissions
• Resources & Navigation
• Session Management
• Audit Logging
• PostgreSQL + Supabase
  `
  )
  .setVersion('1.0.0')
  .setContact(
    'Miguel Angel Rosales Jimenez',
    'https://angel-rosales.com',
    'angelrosales1profesional@gmail.com'
  )
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
    'JWT'
  )
  .build();

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { SwaggerModule } from '@nestjs/swagger';
import { swaggerConfig } from './config/swagger/swagger.config';

import { setSwaggerDocument } from './docs/swagger.document';

import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],

          styleSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],

          scriptSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],

          imgSrc: ["'self'", 'data:', 'https:'],

          connectSrc: ["'self'", 'https://unpkg.com'],
        },
      },
    })
  );

  //app.use(compression());

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  setSwaggerDocument(document);

  await app.listen(process.env.PORT || 3000);

  console.log(`Application running on port ${process.env.PORT}`);
}

bootstrap();

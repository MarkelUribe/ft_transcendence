import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';
import { readFileSync } from 'fs';


async function bootstrap() {
  const httpsOptions = {
    key: readFileSync('/run/secrets/ssl_key'),
    cert: readFileSync('/run/secrets/ssl_cert'),
  };

  const app = await NestFactory.create(AppModule, {httpsOptions});

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.enableCors({
    // In dev, reflect the request origin to avoid hard-coding
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.use(
    '/uploads',
    express.static(join(__dirname, '..', 'uploads')),
  );
  app.use(
    '/resources',
    express.static(join(__dirname, '..', 'resources')),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

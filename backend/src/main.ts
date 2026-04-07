import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, '..', '..', 'certs', 'localhost+2-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '..', '..', 'certs', 'localhost+2.pem')),
  };

  const app = await NestFactory.create(AppModule, { httpsOptions });


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

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
    origin: ['https://localhost:5173'], // Vite dev URL
    credentials: true,
  });

  app.use(
    '/uploads',
    express.static(join(__dirname, '..', 'uploads')),
  );

  await app.listen(3000);
}
bootstrap();

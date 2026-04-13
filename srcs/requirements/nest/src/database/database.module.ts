//src/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mariadb',
        host: configService.get<string>('MYSQL_HOST') ?? 'db',
        port: Number(configService.get<string>('MYSQL_PORT') ?? 3306),
        username: configService.get<string>('MYSQL_USER'),
        password: readFileSync('/run/secrets/db_password', 'utf8').trim(),
        database: configService.get<string>('MYSQL_DATABASE'),
        autoLoadEntities: true,
        synchronize: true, // dev only
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule { }
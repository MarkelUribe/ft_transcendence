import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as fs from 'fs';

// Tus módulos
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GameModule } from './game/game.module';
import { MatchmakingModule } from './matchmaking/matchmaking.module';
import { FriendsModule } from './friends/friends.module';

// 1. Definimos la función de ayuda
const getSecret = (path: string) => {
  try {
    if (fs.existsSync(path)) {
      return fs.readFileSync(path, 'utf8').trim();
    }
    console.warn(`Advertencia: El archivo ${path} no existe.`);
    return 'mypassword'; 
  } catch (err) {
    console.error(`Error leyendo secreto en ${path}:`, err.message);
    return 'mypassword'; 
  }
};

// 2. Cargamos la contraseña antes de configurar el módulo
const dbPassword = getSecret('/run/secrets/db_password');

@Module({
  imports: [
    // 🔹 Configuración global de variables de entorno
    ConfigModule.forRoot({ isGlobal: true }), 

    // 🔹 Configuración de MariaDB con el secret que acabamos de leer
    TypeOrmModule.forRoot({
      type: 'mysql',
      driver: require('mysql2'),
      connectorPackage: 'mysql2',
      host: 'db', 
      port: 3306,
      username: process.env.MYSQL_USER,
      password: dbPassword, // <--- Usamos la variable protegida
      database: process.env.MYSQL_DATABASE,
      autoLoadEntities: true,
      synchronize: true, 
    }), 

    UsersModule,
    AuthModule,
    GameModule,
    MatchmakingModule,
    FriendsModule,
  ],  
})
export class AppModule {}

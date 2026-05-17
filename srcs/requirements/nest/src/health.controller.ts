// srcs/requirements/nest/src/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm'; // O cambia esto si usas Prisma/Sequelize

@Controller('api')
export class HealthController {
  // Inyectamos DataSource para comprobar la conexión real con MariaDB
  constructor(private readonly dataSource: DataSource) {}

  @Get('health')
  async checkHealth() {
    try {
      // Hace una consulta ultra rápida a MariaDB
      await this.dataSource.query('SELECT 1');
      
      // Si la DB responde, devolvemos el JSON que tu frontend espera
      return { db: 'UP' };
    } catch (error) {
      // Si la DB está caída o no conecta
      return { db: 'DOWN' };
    }
  }
}

import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool, QueryResult } from 'pg';
import { cars } from './data';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

  async onModuleInit() {
    await this.setupDatabase();
  }

  executeQuery(queryText: string, values: any[] = []): any {
    try {
      return this.pool.query(queryText, values).then((result: QueryResult) => result.rows);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async seed() {
    await this.executeQuery(
      `INSERT INTO "Cars" (registration_number)
         VALUES ${cars.map((car) => `('${car.registration_number}')`)}`,
    );
  }

  async setupDatabase() {
    const [carsTable] = await this.executeQuery(
      `SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='Cars'`,
    );
    const [rentTable] = await this.executeQuery(
      `SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='Rent'`,
    );

    if (!carsTable) {
      await this.executeQuery(
        `CREATE TABLE "Cars" (
        car_id SERIAL NOT NULL PRIMARY KEY,
        registration_number VARCHAR(10) NOT NULL
        );`,
      );
      await this.seed();
    }

    if (!rentTable) {
      await this.executeQuery(
        `CREATE TABLE "Rent" (
          id SERIAL NOT NULL PRIMARY KEY,
          car_id integer NOT NULL,
          start_date date NOT NULL,
          end_date date NOT NULL,
          CONSTRAINT fk_car_id
            FOREIGN KEY(car_id)
              REFERENCES "Cars"(car_id)
        );`,
      );
    }
  }
}

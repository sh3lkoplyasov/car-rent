import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config/dist';
import { RentModule } from './rent/rent.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    RentModule,
    DatabaseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

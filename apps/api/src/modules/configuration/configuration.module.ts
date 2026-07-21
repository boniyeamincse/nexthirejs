import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CountriesService } from './services/countries.service';
import { CountriesController } from './controllers/countries.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [CountriesController],
  providers: [CountriesService],
  exports: [CountriesService],
})
export class ConfigurationModule {}

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../database/database.module';
import { ExpertAvailabilityModule } from '../availability/expert-availability.module';
import { ExpertPublicController } from './expert-public.controller';
import { ExpertPublicDirectoryService } from './expert-public-directory.service';
import { ExpertPublicDirectoryRepository } from '../repositories/expert-public-directory.repository';

@Module({
  imports: [DatabaseModule, ExpertAvailabilityModule],
  controllers: [ExpertPublicController],
  providers: [ExpertPublicDirectoryService, ExpertPublicDirectoryRepository],
})
export class ExpertPublicModule {}

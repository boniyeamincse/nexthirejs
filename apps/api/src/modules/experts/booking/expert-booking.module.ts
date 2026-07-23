import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../database/database.module';
import { AuditModule } from '../../../modules/audit/audit.module';
import { AuthModule } from '../../../modules/auth/auth.module';
import { QueueModule } from '../../../infrastructure/queue/queue.module';
import { ExpertAvailabilityModule } from '../availability/expert-availability.module';
import { ExpertBookingCandidateController } from './expert-booking-candidate.controller';
import { ExpertBookingExpertController } from './expert-booking-expert.controller';
import { ExpertBookingService } from './expert-booking.service';
import { ExpertBookingExpirationWorker } from './expert-booking-expiration.worker';

@Module({
  imports: [DatabaseModule, AuditModule, AuthModule, QueueModule, ExpertAvailabilityModule],
  controllers: [ExpertBookingCandidateController, ExpertBookingExpertController],
  providers: [ExpertBookingService, ExpertBookingExpirationWorker],
  exports: [ExpertBookingService],
})
export class ExpertBookingModule {}

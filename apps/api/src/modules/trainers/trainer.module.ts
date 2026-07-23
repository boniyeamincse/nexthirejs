import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { TrainerService } from './trainer.service';
import { TrainerController } from './trainer.controller';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { EvaluationService } from './evaluation.service';
import { EvaluationController } from './evaluation.controller';

@Module({
  imports: [DatabaseModule, AuditModule, AuthModule],
  controllers: [TrainerController, BookingController, EvaluationController],
  providers: [TrainerService, BookingService, EvaluationService],
  exports: [TrainerService, BookingService, EvaluationService],
})
export class TrainerModule {}

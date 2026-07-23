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
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';

@Module({
  imports: [DatabaseModule, AuditModule, AuthModule],
  controllers: [TrainerController, BookingController, EvaluationController, WalletController],
  providers: [TrainerService, BookingService, EvaluationService, WalletService],
  exports: [TrainerService, BookingService, EvaluationService, WalletService],
})
export class TrainerModule {}

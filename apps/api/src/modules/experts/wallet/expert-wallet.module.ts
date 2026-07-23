import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../database/database.module';
import { AuditModule } from '../../../modules/audit/audit.module';
import { AuthModule } from '../../../modules/auth/auth.module';
import { ExpertWalletController } from './expert-wallet.controller';
import { ExpertPayoutAdminController } from './expert-payout-admin.controller';
import { ExpertWalletService } from './expert-wallet.service';

@Module({
  imports: [DatabaseModule, AuditModule, AuthModule],
  controllers: [ExpertWalletController, ExpertPayoutAdminController],
  providers: [ExpertWalletService],
  exports: [ExpertWalletService],
})
export class ExpertWalletModule {}

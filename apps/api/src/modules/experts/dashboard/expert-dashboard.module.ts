import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../database/database.module';
import { AuthModule } from '../../../modules/auth/auth.module';
import { ExpertFeedbackModule } from '../feedback/expert-feedback.module';
import { ExpertWalletModule } from '../wallet/expert-wallet.module';
import { ExpertDashboardController } from './expert-dashboard.controller';
import { ExpertDashboardService } from './expert-dashboard.service';

@Module({
  imports: [DatabaseModule, AuthModule, ExpertFeedbackModule, ExpertWalletModule],
  controllers: [ExpertDashboardController],
  providers: [ExpertDashboardService],
})
export class ExpertDashboardModule {}

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../database/database.module';
import { AuditModule } from '../../../modules/audit/audit.module';
import { AuthModule } from '../../../modules/auth/auth.module';
import { ExpertFeedbackCandidateController } from './expert-feedback-candidate.controller';
import {
  ExpertFeedbackExpertBookingController,
  ExpertReviewsController,
} from './expert-feedback-expert.controller';
import { ExpertReviewAdminController } from './expert-review-admin.controller';
import { ExpertSessionEvaluationService } from './expert-session-evaluation.service';
import { ExpertReviewService } from './expert-review.service';

@Module({
  imports: [DatabaseModule, AuditModule, AuthModule],
  controllers: [
    ExpertFeedbackCandidateController,
    ExpertFeedbackExpertBookingController,
    ExpertReviewsController,
    ExpertReviewAdminController,
  ],
  providers: [ExpertSessionEvaluationService, ExpertReviewService],
  exports: [ExpertReviewService],
})
export class ExpertFeedbackModule {}

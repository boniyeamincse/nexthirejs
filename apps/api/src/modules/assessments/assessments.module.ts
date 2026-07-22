import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { QueueModule } from '../../infrastructure/queue/queue.module';
import { AssessmentCatalogController } from './controllers/assessment-catalog.controller';
import { AssessmentCatalogService } from './services/assessment-catalog.service';
import { AssessmentLifecycleService } from './services/assessment-lifecycle.service';
import { AssessmentRepository } from './repositories/assessment.repository';
import { AssessmentCategoryRepository } from './repositories/assessment-category.repository';

import { AssessmentCategoryManagementController } from './management/controllers/assessment-category-management.controller';
import { AssessmentCategoryManagementService } from './management/services/assessment-category-management.service';
import { AssessmentQuestionManagementController } from './management/controllers/assessment-question-management.controller';
import { AssessmentQuestionManagementService } from './management/services/assessment-question-management.service';

import { AssessmentManagementController } from './management/controllers/assessment-management.controller';
import { AssessmentSectionController } from './management/controllers/assessment-section.controller';
import { AssessmentAssignmentController } from './management/controllers/assessment-assignment.controller';

import { AssessmentAuthoringService } from './management/services/assessment-authoring.service';
import { AssessmentSectionService } from './management/services/assessment-section.service';
import { AssessmentAssignmentService } from './management/services/assessment-assignment.service';
import { AssessmentReadinessService, AssessmentPublicationService } from './management/services/assessment-publication.service';

import { AuthModule } from '../auth/auth.module';

import { CandidateAssessmentAttemptController } from './attempts/controllers/candidate-assessment-attempt.controller';
import { AssessmentAttemptStartService } from './attempts/services/assessment-attempt-start.service';
import { AssessmentAttemptSnapshotService } from './attempts/services/assessment-attempt-snapshot.service';
import { AssessmentAttemptWorkspaceService } from './attempts/services/assessment-attempt-workspace.service';
import { AssessmentAttemptAnswerService } from './attempts/services/assessment-attempt-answer.service';
import { AssessmentAttemptProgressService } from './attempts/services/assessment-attempt-progress.service';
import { AssessmentAttemptStateService } from './attempts/services/assessment-attempt-state.service';
import { AssessmentAttemptScoringService } from './attempts/services/assessment-attempt-scoring.service';
import { AssessmentAttemptFinalizationService } from './attempts/services/assessment-attempt-finalization.service';
import { AssessmentAttemptSubmissionService } from './attempts/services/assessment-attempt-submission.service';

import { CandidateAssessmentResultsController } from './results/controllers/candidate-assessment-results.controller';
import { AssessmentResultHistoryService } from './results/services/assessment-result-history.service';
import { AssessmentResultDetailService } from './results/services/assessment-result-detail.service';
import { AssessmentResultMapperService } from './results/services/assessment-result-mapper.service';
import { AssessmentResultConsistencyService } from './results/services/assessment-result-consistency.service';
import { AssessmentResultRepository } from './results/repositories/assessment-result.repository';

import { CandidateAssessmentPerformanceController } from './analytics/controllers/candidate-assessment-performance.controller';
import { AssessmentLeaderboardController } from './analytics/controllers/assessment-leaderboard.controller';
import { AssessmentPerformanceService } from './analytics/services/assessment-performance.service';
import { AssessmentPerformanceAggregationService } from './analytics/services/assessment-performance-aggregation.service';
import { LeaderboardParticipationService } from './analytics/services/leaderboard-participation.service';
import { LeaderboardIdentityService } from './analytics/services/leaderboard-identity.service';
import { AssessmentLeaderboardService } from './analytics/services/assessment-leaderboard.service';
import { CategoryLeaderboardService } from './analytics/services/category-leaderboard.service';
import { AssessmentAnalyticsRepository } from './analytics/repositories/assessment-analytics.repository';

// Retakes
import { RetakeController } from './retakes/controllers/retake.controller';
import { RetakeEligibilityService } from './retakes/services/retake-eligibility.service';
import { RetakePolicyService } from './retakes/services/retake-policy.service';

// Certificates
import { CertificateController } from './certificates/controllers/certificate.controller';
import { CertificateVerificationController } from './certificates/controllers/certificate-verification.controller';
import { CertificateService } from './certificates/services/certificate.service';
import { CertificateEligibilityService } from './certificates/services/certificate-eligibility.service';
import { CertificateIssuanceService } from './certificates/services/certificate-issuance.service';
import { CertificateVerificationService } from './certificates/services/certificate-verification.service';
import { CertificatePdfService } from './certificates/pdf/certificate-pdf.service';
import { CertificateWorker } from './certificates/worker/certificate.worker';
import { CertificateStorageService } from '../../infrastructure/storage/certificate-storage.service';

@Module({
  imports: [DatabaseModule, AuditModule, AuthModule, QueueModule],
  controllers: [
    AssessmentCatalogController,
    AssessmentCategoryManagementController,
    AssessmentQuestionManagementController,
    AssessmentManagementController,
    AssessmentSectionController,
    AssessmentAssignmentController,
    CandidateAssessmentAttemptController,
    CandidateAssessmentResultsController,
    CandidateAssessmentPerformanceController,
    AssessmentLeaderboardController,
    RetakeController,
    CertificateController,
    CertificateVerificationController,
  ],
  providers: [
    AssessmentCatalogService,
    AssessmentLifecycleService,
    AssessmentRepository,
    AssessmentCategoryRepository,
    AssessmentCategoryManagementService,
    AssessmentQuestionManagementService,
    AssessmentAuthoringService,
    AssessmentSectionService,
    AssessmentAssignmentService,
    AssessmentReadinessService,
    AssessmentPublicationService,
    AssessmentAttemptStartService,
    AssessmentAttemptSnapshotService,
    AssessmentAttemptWorkspaceService,
    AssessmentAttemptAnswerService,
    AssessmentAttemptProgressService,
    AssessmentAttemptStateService,
    AssessmentAttemptScoringService,
    AssessmentAttemptFinalizationService,
    AssessmentAttemptSubmissionService,
    AssessmentResultRepository,
    AssessmentResultHistoryService,
    AssessmentResultDetailService,
    AssessmentResultMapperService,
    AssessmentResultConsistencyService,
    AssessmentPerformanceService,
    AssessmentPerformanceAggregationService,
    LeaderboardParticipationService,
    LeaderboardIdentityService,
    AssessmentLeaderboardService,
    CategoryLeaderboardService,
    AssessmentAnalyticsRepository,
    RetakeEligibilityService,
    RetakePolicyService,
    CertificateService,
    CertificateEligibilityService,
    CertificateIssuanceService,
    CertificateVerificationService,
    CertificatePdfService,
    CertificateWorker,
    CertificateStorageService,
  ],
  exports: [AssessmentLifecycleService, AssessmentRepository, AssessmentCategoryRepository],
})
export class AssessmentsModule {}

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../audit/audit.module';
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

@Module({
  imports: [DatabaseModule, AuditModule, AuthModule],
  controllers: [
    AssessmentCatalogController,
    AssessmentCategoryManagementController,
    AssessmentQuestionManagementController,
    AssessmentManagementController,
    AssessmentSectionController,
    AssessmentAssignmentController,
    CandidateAssessmentAttemptController,
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
  ],
  exports: [AssessmentLifecycleService, AssessmentRepository, AssessmentCategoryRepository],
})
export class AssessmentsModule {}

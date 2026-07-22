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

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuditModule, AuthModule],
  controllers: [
    AssessmentCatalogController,
    AssessmentCategoryManagementController,
    AssessmentQuestionManagementController,
  ],
  providers: [
    AssessmentCatalogService,
    AssessmentLifecycleService,
    AssessmentRepository,
    AssessmentCategoryRepository,
    AssessmentCategoryManagementService,
    AssessmentQuestionManagementService,
  ],
  exports: [AssessmentLifecycleService, AssessmentRepository, AssessmentCategoryRepository],
})
export class AssessmentsModule {}

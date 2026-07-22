import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { AssessmentCatalogController } from './controllers/assessment-catalog.controller';
import { AssessmentCatalogService } from './services/assessment-catalog.service';
import { AssessmentLifecycleService } from './services/assessment-lifecycle.service';
import { AssessmentRepository } from './repositories/assessment.repository';
import { AssessmentCategoryRepository } from './repositories/assessment-category.repository';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuditModule, AuthModule],
  controllers: [AssessmentCatalogController],
  providers: [
    AssessmentCatalogService,
    AssessmentLifecycleService,
    AssessmentRepository,
    AssessmentCategoryRepository,
  ],
  exports: [AssessmentLifecycleService, AssessmentRepository, AssessmentCategoryRepository],
})
export class AssessmentsModule {}

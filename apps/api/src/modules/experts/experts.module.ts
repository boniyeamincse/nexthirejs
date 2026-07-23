import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

import { ExpertProfileController } from './controllers/expert-profile.controller';
import { ExpertApplicationController } from './controllers/expert-application.controller';
import { ExpertApplicationAdminController } from './controllers/expert-application-admin.controller';

import { ExpertProfileService } from './services/expert-profile.service';
import { ExpertApplicationService } from './services/expert-application.service';
import { ExpertApplicationReadinessService } from './services/expert-application-readiness.service';
import { ExpertDocumentService } from './services/expert-document.service';
import { ExpertApplicationReviewService } from './services/expert-application-review.service';
import { ExpertDocumentStorageService } from './services/expert-document-storage.service';

import { ExpertProfileRepository } from './repositories/expert-profile.repository';
import { ExpertApplicationRepository } from './repositories/expert-application.repository';
import { ExpertDocumentRepository } from './repositories/expert-document.repository';

import { ExpertiseModule } from './expertise/expertise.module';
import { ExpertServiceModule } from './services/expert-service.module';
import { ExpertAvailabilityModule } from './availability/expert-availability.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuditModule,
    AuthModule,
    ExpertiseModule,
    ExpertServiceModule,
    ExpertAvailabilityModule,
  ],
  controllers: [
    ExpertProfileController,
    ExpertApplicationController,
    ExpertApplicationAdminController,
  ],
  providers: [
    ExpertProfileService,
    ExpertApplicationService,
    ExpertApplicationReadinessService,
    ExpertDocumentService,
    ExpertApplicationReviewService,
    ExpertDocumentStorageService,
    ExpertProfileRepository,
    ExpertApplicationRepository,
    ExpertDocumentRepository,
  ],
})
export class ExpertsModule {}

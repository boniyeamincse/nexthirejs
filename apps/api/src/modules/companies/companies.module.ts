import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

import { CompanyProfileController } from './controllers/company-profile.controller';
import { CompanyApplicationController } from './controllers/company-application.controller';
import { CompanyApplicationAdminController } from './controllers/company-application-admin.controller';

import { CompanyProfileService } from './services/company-profile.service';
import { CompanyApplicationService } from './services/company-application.service';
import { CompanyApplicationReadinessService } from './services/company-application-readiness.service';
import { CompanyDocumentService } from './services/company-document.service';
import { CompanyApplicationReviewService } from './services/company-application-review.service';
import { CompanyDocumentStorageService } from './services/company-document-storage.service';

import { CompanyRepository } from './repositories/company.repository';
import { CompanyApplicationRepository } from './repositories/company-application.repository';
import { CompanyDocumentRepository } from './repositories/company-document.repository';

@Module({
  imports: [ConfigModule, DatabaseModule, AuditModule, AuthModule],
  controllers: [
    CompanyProfileController,
    CompanyApplicationController,
    CompanyApplicationAdminController,
  ],
  providers: [
    CompanyProfileService,
    CompanyApplicationService,
    CompanyApplicationReadinessService,
    CompanyDocumentService,
    CompanyApplicationReviewService,
    CompanyDocumentStorageService,
    CompanyRepository,
    CompanyApplicationRepository,
    CompanyDocumentRepository,
  ],
})
export class CompaniesModule {}

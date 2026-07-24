import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { CandidatesModule } from '../candidates/candidates.module';
import { CvModule } from '../cv/cv.module';

import { CompanyProfileController } from './controllers/company-profile.controller';
import { CompanyApplicationController } from './controllers/company-application.controller';
import { CompanyApplicationAdminController } from './controllers/company-application-admin.controller';
import { CompanyTeamController } from './controllers/company-team.controller';
import { CompanyInvitationsMeController } from './controllers/company-invitations-me.controller';
import { CompanyCandidateSearchController } from './controllers/company-candidate-search.controller';
import { TalentPipelineController } from './controllers/talent-pipeline.controller';

import { CompanyProfileService } from './services/company-profile.service';
import { CompanyApplicationService } from './services/company-application.service';
import { CompanyApplicationReadinessService } from './services/company-application-readiness.service';
import { CompanyDocumentService } from './services/company-document.service';
import { CompanyApplicationReviewService } from './services/company-application-review.service';
import { CompanyDocumentStorageService } from './services/company-document-storage.service';
import { CompanyMembershipService } from './services/company-membership.service';
import { CompanyInvitationService } from './services/company-invitation.service';
import { CompanyVerifiedAccessService } from './services/company-verified-access.service';
import { TalentPipelineService } from './services/talent-pipeline.service';

import { CompanyRepository } from './repositories/company.repository';
import { CompanyApplicationRepository } from './repositories/company-application.repository';
import { CompanyDocumentRepository } from './repositories/company-document.repository';
import { CompanyMemberRepository } from './repositories/company-member.repository';
import { CompanyInvitationRepository } from './repositories/company-invitation.repository';
import { TalentShortlistRepository } from './repositories/talent-shortlist.repository';

@Module({
  imports: [ConfigModule, DatabaseModule, AuditModule, AuthModule, CandidatesModule, CvModule],
  controllers: [
    CompanyProfileController,
    CompanyApplicationController,
    CompanyApplicationAdminController,
    CompanyTeamController,
    CompanyInvitationsMeController,
    CompanyCandidateSearchController,
    TalentPipelineController,
  ],
  providers: [
    CompanyProfileService,
    CompanyApplicationService,
    CompanyApplicationReadinessService,
    CompanyDocumentService,
    CompanyApplicationReviewService,
    CompanyDocumentStorageService,
    CompanyMembershipService,
    CompanyInvitationService,
    CompanyVerifiedAccessService,
    TalentPipelineService,
    CompanyRepository,
    CompanyApplicationRepository,
    CompanyDocumentRepository,
    CompanyMemberRepository,
    CompanyInvitationRepository,
    TalentShortlistRepository,
  ],
})
export class CompaniesModule {}

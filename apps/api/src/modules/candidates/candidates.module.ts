import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CandidateProfileController } from './controllers/candidate-profile.controller';
import { CandidatePreferencesController } from './controllers/candidate-preferences.controller';
import { CandidateEducationController } from './controllers/candidate-education.controller';
import { CandidateWorkExperienceController } from './controllers/candidate-work-experience.controller';
import { CandidateSkillController } from './controllers/candidate-skill.controller';
import { CandidateLanguageController } from './controllers/candidate-language.controller';
import { CandidateAchievementController } from './controllers/candidate-achievement.controller';
import { CandidateProfessionalLinkController } from './controllers/candidate-professional-link.controller';
import { CandidateProfilePrivacyController } from './privacy/candidate-profile-privacy.controller';
import { CandidateCertificationController } from './controllers/candidate-certification.controller';
import { CandidateTrainingController } from './controllers/candidate-training.controller';
import { CandidateProfileService } from './services/candidate-profile.service';
import { CandidatePreferencesService } from './services/candidate-preferences.service';
import { CandidateProfileCompletionService } from './services/candidate-profile-completion.service';
import { CandidateEducationService } from './services/candidate-education.service';
import { CandidateWorkExperienceService } from './services/candidate-work-experience.service';
import { CandidateSkillService } from './services/candidate-skill.service';
import { CandidateLanguageService } from './services/candidate-language.service';
import { CandidateCertificationService } from './services/candidate-certification.service';
import { CandidateTrainingService } from './services/candidate-training.service';
import { CandidateAchievementService } from './services/candidate-achievement.service';
import { CandidateProfessionalLinkService } from './services/candidate-professional-link.service';
import { CandidateProfilePrivacyService } from './privacy/candidate-profile-privacy.service';
import { CandidatePrivacyPolicyService } from './privacy/candidate-privacy-policy.service';
import { CandidatePrivacyDecisionService } from './privacy/candidate-privacy-decision.service';
import { CandidateProfilePreviewService } from './profile-preview/candidate-profile-preview.service';
import { CandidateProfilePreviewController } from './profile-preview/candidate-profile-preview.controller';
import { ProfileCompletionController } from './profile-completion/profile-completion.controller';
import { ProfileCompletionDashboardService } from './profile-completion/profile-completion-dashboard.service';
import { ProfileSectionStatusService } from './profile-completion/profile-section-status.service';
import { ProfileCompletionActionService } from './profile-completion/profile-completion-action.service';
import { CandidateShareTokenService } from './share-token/candidate-share-token.service';
import { CandidateProfilePrivacyRepository } from './privacy/candidate-profile-privacy.repository';
import { CandidateShareTokenRepository } from './share-token/candidate-share-token.repository';
import { CandidateShareTokenController } from './share-token/candidate-share-token.controller';
import { CandidateProfileRepository } from './repositories/candidate-profile.repository';
import { CandidatePreferencesRepository } from './repositories/candidate-preferences.repository';
import { CandidateEducationRepository } from './repositories/candidate-education.repository';
import { CandidateWorkExperienceRepository } from './repositories/candidate-work-experience.repository';
import { CandidateSkillRepository } from './repositories/candidate-skill.repository';
import { CandidateLanguageRepository } from './repositories/candidate-language.repository';
import { CandidateCertificationRepository } from './repositories/candidate-certification.repository';
import { CandidateTrainingRepository } from './repositories/candidate-training.repository';
import { CandidateAchievementRepository } from './repositories/candidate-achievement.repository';
import { CandidateProfessionalLinkRepository } from './repositories/candidate-professional-link.repository';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { DatabaseModule } from '../../database/database.module';
import { TokenService } from '../auth/token.service';
import { SessionService } from '../auth/session.service';
import { RequestContextModule } from '../../common/request-context/request-context.module';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { DATA_EXPORT_QUEUE } from '../../infrastructure/queue/queue.constants';
import { CandidateDataExportController } from './data-export/candidate-data-export.controller';
import { CandidateDataExportService } from './data-export/candidate-data-export.service';
import { CandidateDataExportProcessor } from './data-export/candidate-data-export.processor';
import { AccountDeactivationController } from './account-lifecycle/account-deactivation.controller';
import { AccountDeactivationService } from './account-lifecycle/account-deactivation.service';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    AuditModule,
    RequestContextModule,
    StorageModule,
    BullModule.registerQueue({ name: DATA_EXPORT_QUEUE }),
  ],
  controllers: [
    CandidateProfileController,
    CandidatePreferencesController,
    CandidateEducationController,
    CandidateWorkExperienceController,
    CandidateSkillController,
    CandidateLanguageController,
    CandidateCertificationController,
    CandidateTrainingController,
    CandidateAchievementController,
    CandidateProfessionalLinkController,
    CandidateProfilePrivacyController,
    CandidateProfilePreviewController,
    CandidateShareTokenController,
    ProfileCompletionController,
    CandidateDataExportController,
    AccountDeactivationController,
  ],
  providers: [
    CandidateProfileService,
    CandidatePreferencesService,
    CandidateProfileCompletionService,
    CandidateEducationService,
    CandidateWorkExperienceService,
    CandidateSkillService,
    CandidateLanguageService,
    CandidateCertificationService,
    CandidateTrainingService,
    CandidateProfileRepository,
    CandidatePreferencesRepository,
    CandidateEducationRepository,
    CandidateWorkExperienceRepository,
    CandidateSkillRepository,
    CandidateLanguageRepository,
    CandidateCertificationRepository,
    CandidateTrainingRepository,
    CandidateAchievementRepository,
    CandidateProfessionalLinkRepository,
    CandidateAchievementService,
    CandidateProfessionalLinkService,
    CandidateProfilePrivacyService,
    CandidatePrivacyPolicyService,
    CandidatePrivacyDecisionService,
    CandidateProfilePrivacyRepository,
    CandidateProfilePreviewService,
    CandidateShareTokenService,
    ProfileCompletionDashboardService,
    ProfileSectionStatusService,
    ProfileCompletionActionService,
    CandidateShareTokenRepository,
    TokenService,
    SessionService,
    CandidateDataExportService,
    CandidateDataExportProcessor,
    AccountDeactivationService,
  ],
  exports: [
    CandidateProfileCompletionService,
    CandidateProfilePreviewService,
    CandidateShareTokenService,
    CandidateSkillService,
    CandidateLanguageService,
    CandidateCertificationService,
    CandidateTrainingService,
  ],
})
export class CandidatesModule {}

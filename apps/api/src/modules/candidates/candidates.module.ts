import { Module } from '@nestjs/common';
import { CandidateProfileController } from './controllers/candidate-profile.controller';
import { CandidatePreferencesController } from './controllers/candidate-preferences.controller';
import { CandidateEducationController } from './controllers/candidate-education.controller';
import { CandidateWorkExperienceController } from './controllers/candidate-work-experience.controller';
import { CandidateSkillController } from './controllers/candidate-skill.controller';
import { CandidateLanguageController } from './controllers/candidate-language.controller';
import { CandidateAchievementController } from './controllers/candidate-achievement.controller';
import { CandidateProfessionalLinkController } from './controllers/candidate-professional-link.controller';
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

@Module({
  imports: [DatabaseModule, AuthModule, AuditModule, RequestContextModule],
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
    TokenService,
    SessionService,
  ],
  exports: [
    CandidateProfileCompletionService,
    CandidateSkillService,
    CandidateLanguageService,
    CandidateCertificationService,
    CandidateTrainingService,
  ],
})
export class CandidatesModule {}

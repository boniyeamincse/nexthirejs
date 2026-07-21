import { Module } from '@nestjs/common';
import { CandidateProfileController } from './controllers/candidate-profile.controller';
import { CandidatePreferencesController } from './controllers/candidate-preferences.controller';
import { CandidateEducationController } from './controllers/candidate-education.controller';
import { CandidateWorkExperienceController } from './controllers/candidate-work-experience.controller';
import { CandidateSkillController } from './controllers/candidate-skill.controller';
import { CandidateLanguageController } from './controllers/candidate-language.controller';
import { CandidateProfileService } from './services/candidate-profile.service';
import { CandidatePreferencesService } from './services/candidate-preferences.service';
import { CandidateProfileCompletionService } from './services/candidate-profile-completion.service';
import { CandidateEducationService } from './services/candidate-education.service';
import { CandidateWorkExperienceService } from './services/candidate-work-experience.service';
import { CandidateSkillService } from './services/candidate-skill.service';
import { CandidateLanguageService } from './services/candidate-language.service';
import { CandidateProfileRepository } from './repositories/candidate-profile.repository';
import { CandidatePreferencesRepository } from './repositories/candidate-preferences.repository';
import { CandidateEducationRepository } from './repositories/candidate-education.repository';
import { CandidateWorkExperienceRepository } from './repositories/candidate-work-experience.repository';
import { CandidateSkillRepository } from './repositories/candidate-skill.repository';
import { CandidateLanguageRepository } from './repositories/candidate-language.repository';
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
  ],
  providers: [
    CandidateProfileService,
    CandidatePreferencesService,
    CandidateProfileCompletionService,
    CandidateEducationService,
    CandidateWorkExperienceService,
    CandidateSkillService,
    CandidateLanguageService,
    CandidateProfileRepository,
    CandidatePreferencesRepository,
    CandidateEducationRepository,
    CandidateWorkExperienceRepository,
    CandidateSkillRepository,
    CandidateLanguageRepository,
    TokenService,
    SessionService,
  ],
  exports: [
    CandidateProfileCompletionService,
    CandidateSkillService,
    CandidateLanguageService,
  ],
})
export class CandidatesModule {}

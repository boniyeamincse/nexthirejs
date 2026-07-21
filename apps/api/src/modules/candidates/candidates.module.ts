import { Module } from '@nestjs/common';
import { CandidateProfileController } from './controllers/candidate-profile.controller';
import { CandidatePreferencesController } from './controllers/candidate-preferences.controller';
import { CandidateProfileService } from './services/candidate-profile.service';
import { CandidatePreferencesService } from './services/candidate-preferences.service';
import { CandidateProfileCompletionService } from './services/candidate-profile-completion.service';
import { CandidateProfileRepository } from './repositories/candidate-profile.repository';
import { CandidatePreferencesRepository } from './repositories/candidate-preferences.repository';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { DatabaseModule } from '../../database/database.module';
import { TokenService } from '../auth/token.service';
import { SessionService } from '../auth/session.service';
import { RequestContextModule } from '../../common/request-context/request-context.module';

@Module({
  imports: [DatabaseModule, AuthModule, AuditModule, RequestContextModule],
  controllers: [CandidateProfileController, CandidatePreferencesController],
  providers: [
    CandidateProfileService,
    CandidatePreferencesService,
    CandidateProfileCompletionService,
    CandidateProfileRepository,
    CandidatePreferencesRepository,
    TokenService,
    SessionService,
  ],
})
export class CandidatesModule {}

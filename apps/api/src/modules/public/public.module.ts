import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth';
import { AuditModule } from '../audit';
import { CandidatesModule } from '../candidates/candidates.module';
import { PublicCandidateProfileController } from './candidate-profile/public-candidate-profile.controller';
import { PublicCandidateProfileService } from './candidate-profile/public-candidate-profile.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuditModule, CandidatesModule],
  controllers: [PublicCandidateProfileController],
  providers: [PublicCandidateProfileService],
})
export class PublicModule {}

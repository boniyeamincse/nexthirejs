import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../database/database.module';
import { AuditModule } from '../../../modules/audit/audit.module';
import { AuthModule } from '../../../modules/auth/auth.module';
import { ExpertiseAreaController } from './expertise-area.controller';
import { ExpertExpertiseController } from './expert-expertise.controller';

@Module({
  imports: [DatabaseModule, AuditModule, AuthModule],
  controllers: [ExpertiseAreaController, ExpertExpertiseController],
})
export class ExpertiseModule {}

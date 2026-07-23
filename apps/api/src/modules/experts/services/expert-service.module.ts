import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../database/database.module';
import { AuditModule } from '../../../modules/audit/audit.module';
import { AuthModule } from '../../../modules/auth/auth.module';
import { ExpertServiceController } from './expert-service.controller';

@Module({
  imports: [DatabaseModule, AuditModule, AuthModule],
  controllers: [ExpertServiceController],
})
export class ExpertServiceModule {}

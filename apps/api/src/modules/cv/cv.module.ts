import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { CvService } from './cv.service';
import { CvController } from './cv.controller';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [CvController],
  providers: [CvService],
  exports: [CvService],
})
export class CvModule {}

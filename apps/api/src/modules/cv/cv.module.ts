import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { CvService } from './cv.service';
import { CvController } from './cv.controller';
import { CvSectionService } from './cv-section.service';
import { CvSectionController } from './cv-section.controller';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [CvController, CvSectionController],
  providers: [CvService, CvSectionService],
  exports: [CvService, CvSectionService],
})
export class CvModule {}

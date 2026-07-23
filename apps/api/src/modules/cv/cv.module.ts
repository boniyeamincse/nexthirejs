import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { CvService } from './cv.service';
import { CvController } from './cv.controller';
import { CvSectionService } from './cv-section.service';
import { CvSectionController } from './cv-section.controller';
import { CvExportService } from './cv-export.service';

@Module({
  imports: [DatabaseModule, AuditModule, AuthModule],
  controllers: [CvController, CvSectionController],
  providers: [CvService, CvSectionService, CvExportService],
  exports: [CvService, CvSectionService, CvExportService],
})
export class CvModule {}

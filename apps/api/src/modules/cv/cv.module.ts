import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { QueueModule } from '../../infrastructure/queue/queue.module';
import { CvService } from './cv.service';
import { CvController } from './cv.controller';
import { CvSectionService } from './cv-section.service';
import { CvSectionController } from './cv-section.controller';
import { CvExportService } from './cv-export.service';
import { CvReadinessService } from './cv-readiness.service';
import { CvProfileImportService } from './cv-profile-import.service';
import { CvExportController } from './export/cv-export.controller';
import { CvExportRequestService } from './export/cv-export-request.service';
import { CvExportWorker } from './export/cv-export.worker';
import { CvPdfService } from './export/cv-pdf.service';
import { CvStorageService } from '../../infrastructure/storage/cv-storage.service';

@Module({
  imports: [DatabaseModule, AuditModule, AuthModule, QueueModule],
  controllers: [CvController, CvSectionController, CvExportController],
  providers: [
    CvService,
    CvSectionService,
    CvExportService,
    CvReadinessService,
    CvProfileImportService,
    CvExportRequestService,
    CvExportWorker,
    CvPdfService,
    CvStorageService,
  ],
  exports: [CvService, CvSectionService, CvExportService],
})
export class CvModule {}

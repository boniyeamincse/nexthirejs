import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { CompanyDocumentTypeValue } from '@nexthire/types';

@Injectable()
export class CompanyDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  countActive(applicationId: string): Promise<number> {
    return this.prisma.companyVerificationDocument.count({
      where: { applicationId, removedAt: null },
    });
  }

  listActive(applicationId: string) {
    return this.prisma.companyVerificationDocument.findMany({
      where: { applicationId, removedAt: null },
      orderBy: { uploadedAt: 'asc' },
    });
  }

  findActiveById(documentId: string, applicationId: string) {
    return this.prisma.companyVerificationDocument.findFirst({
      where: { id: documentId, applicationId, removedAt: null },
    });
  }

  findByStorageKey(storageKey: string) {
    return this.prisma.companyVerificationDocument.findUnique({ where: { storageKey } });
  }

  create(data: {
    applicationId: string;
    type: CompanyDocumentTypeValue;
    storageKey: string;
    originalFileName: string;
    mimeType: string;
    sizeBytes: number;
    checksumSha256: string;
  }) {
    return this.prisma.companyVerificationDocument.create({
      data: {
        applicationId: data.applicationId,
        type: data.type,
        storageKey: data.storageKey,
        originalFileName: data.originalFileName,
        mimeType: data.mimeType,
        sizeBytes: BigInt(data.sizeBytes),
        checksumSha256: data.checksumSha256,
      },
    });
  }

  softRemove(documentId: string, now: Date) {
    return this.prisma.companyVerificationDocument.update({
      where: { id: documentId },
      data: { removedAt: now },
    });
  }
}

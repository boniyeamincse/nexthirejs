import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { ExpertVerificationDocumentTypeValue } from '@nexthire/types';

@Injectable()
export class ExpertDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  countActive(applicationId: string): Promise<number> {
    return this.prisma.expertVerificationDocument.count({
      where: { applicationId, removedAt: null },
    });
  }

  listActive(applicationId: string) {
    return this.prisma.expertVerificationDocument.findMany({
      where: { applicationId, removedAt: null },
      orderBy: { uploadedAt: 'asc' },
    });
  }

  findActiveById(documentId: string, applicationId: string) {
    return this.prisma.expertVerificationDocument.findFirst({
      where: { id: documentId, applicationId, removedAt: null },
    });
  }

  findByStorageKey(storageKey: string) {
    return this.prisma.expertVerificationDocument.findUnique({
      where: { storageKey },
    });
  }

  create(data: {
    applicationId: string;
    type: ExpertVerificationDocumentTypeValue;
    storageKey: string;
    originalFileName: string;
    mimeType: string;
    sizeBytes: number;
    checksumSha256: string;
  }) {
    return this.prisma.expertVerificationDocument.create({
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
    return this.prisma.expertVerificationDocument.update({
      where: { id: documentId },
      data: { removedAt: now },
    });
  }
}

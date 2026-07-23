import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CandidatePhotoStorageService } from './candidate-photo-storage.service';
import { detectFileType } from '../../experts/shared/file-signature.util';
import { AuditService } from '../../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';

export const CANDIDATE_PHOTO_MAX_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png'] as const;

export interface CandidatePhotoStatus {
  hasPhoto: boolean;
  mimeType: string | null;
  sizeBytes: number | null;
  updatedAt: string | null;
}

export interface CandidatePhotoContent {
  buffer: Buffer;
  mimeType: string;
}

@Injectable()
export class CandidatePhotoService {
  private readonly logger = new Logger(CandidatePhotoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: CandidatePhotoStorageService,
    private readonly auditService: AuditService,
  ) {}

  async getStatus(userId: string): Promise<CandidatePhotoStatus> {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
      select: {
        photoStorageKey: true,
        photoMimeType: true,
        photoSizeBytes: true,
        photoUpdatedAt: true,
      },
    });

    return {
      hasPhoto: Boolean(profile?.photoStorageKey),
      mimeType: profile?.photoMimeType ?? null,
      sizeBytes: profile?.photoSizeBytes ?? null,
      updatedAt: profile?.photoUpdatedAt?.toISOString() ?? null,
    };
  }

  async upload(
    userId: string,
    file: { buffer: Buffer; size: number; mimetype?: string } | undefined,
  ): Promise<CandidatePhotoStatus> {
    if (!file || !file.buffer || file.size === 0) {
      throw new BadRequestException('CANDIDATE_PHOTO_FILE_REQUIRED');
    }
    if (file.size > CANDIDATE_PHOTO_MAX_BYTES) {
      throw new PayloadTooLargeException('CANDIDATE_PHOTO_TOO_LARGE');
    }

    // Never trust the client MIME type — detect from magic bytes.
    const detected = detectFileType(file.buffer);
    if (!detected || !(ALLOWED_PHOTO_TYPES as readonly string[]).includes(detected)) {
      throw new UnsupportedMediaTypeException('CANDIDATE_PHOTO_TYPE_UNSUPPORTED');
    }

    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
      select: { id: true, photoStorageKey: true },
    });
    if (!profile) {
      throw new BadRequestException('CANDIDATE_PROFILE_REQUIRED_FOR_PHOTO');
    }

    const storageKey = this.storage.generateKey(userId);
    await this.storage.put(storageKey, file.buffer);

    const updatedAt = new Date();
    const previousKey = profile.photoStorageKey;

    await this.prisma.candidateProfile.update({
      where: { userId },
      data: {
        photoStorageKey: storageKey,
        photoMimeType: detected,
        photoSizeBytes: file.size,
        photoUpdatedAt: updatedAt,
      },
    });

    if (previousKey) {
      await this.storage.delete(previousKey).catch((error) => {
        this.logger.warn(`Failed to delete replaced photo object: ${String(error)}`);
      });
    }

    await this.auditService.recordBestEffort({
      action: 'candidate.photo.uploaded',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'CandidateProfile',
      targetId: profile.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { mimeType: detected, sizeBytes: file.size, replaced: Boolean(previousKey) },
    });

    return {
      hasPhoto: true,
      mimeType: detected,
      sizeBytes: file.size,
      updatedAt: updatedAt.toISOString(),
    };
  }

  /** Owner-only photo content. Cross-user access is impossible: key comes from the caller's own profile row. */
  async getContent(userId: string): Promise<CandidatePhotoContent> {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
      select: { photoStorageKey: true, photoMimeType: true },
    });

    if (!profile?.photoStorageKey || !profile.photoMimeType) {
      throw new NotFoundException('CANDIDATE_PHOTO_NOT_FOUND');
    }

    const buffer = await this.storage.read(profile.photoStorageKey);
    return { buffer, mimeType: profile.photoMimeType };
  }

  async remove(userId: string): Promise<void> {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
      select: { id: true, photoStorageKey: true },
    });

    if (!profile?.photoStorageKey) {
      throw new NotFoundException('CANDIDATE_PHOTO_NOT_FOUND');
    }

    await this.prisma.candidateProfile.update({
      where: { userId },
      data: {
        photoStorageKey: null,
        photoMimeType: null,
        photoSizeBytes: null,
        photoUpdatedAt: null,
      },
    });

    await this.storage.delete(profile.photoStorageKey).catch((error) => {
      this.logger.warn(`Failed to delete photo object: ${String(error)}`);
    });

    await this.auditService.recordBestEffort({
      action: 'candidate.photo.deleted',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'CandidateProfile',
      targetId: profile.id,
      outcome: AuditOutcome.SUCCESS,
    });
  }
}

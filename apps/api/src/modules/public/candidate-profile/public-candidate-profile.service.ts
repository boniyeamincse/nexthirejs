import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CandidateProfilePreviewService } from '../../candidates/profile-preview/candidate-profile-preview.service';

@Injectable()
export class PublicCandidateProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly previewService: CandidateProfilePreviewService,
  ) {}

  async getPublicProfileByPublicId(publicId: string) {
    return this.previewService.getExternalProfileByPublicId(publicId);
  }

  async getPublicProfileByShareToken(rawToken: string) {
    return this.previewService.getExternalProfileByShareToken(rawToken);
  }
}

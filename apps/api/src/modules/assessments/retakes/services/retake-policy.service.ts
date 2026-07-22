import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { UpdateAssessmentRetakePolicySchema } from '@nexthire/validation';
import { ASSESSMENT_ERROR_CODES } from '@nexthire/constants';
import type { AssessmentRetakePolicy } from '@nexthire/types';

@Injectable()
export class RetakePolicyService {
  private readonly logger = new Logger(RetakePolicyService.name);

  constructor(private readonly prisma: PrismaService) {}

  async updatePolicy(assessmentId: string, input: unknown): Promise<AssessmentRetakePolicy> {
    const parsed = UpdateAssessmentRetakePolicySchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message);
    }

    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { id: true },
    });

    if (!assessment) {
      throw new NotFoundException(ASSESSMENT_ERROR_CODES.ASSESSMENT_NOT_FOUND);
    }

    const data: any = {};
    if (parsed.data.retakeEnabled !== undefined) data.retakeEnabled = parsed.data.retakeEnabled;
    if (parsed.data.maximumAttempts !== undefined) data.maximumAttempts = parsed.data.maximumAttempts;
    if (parsed.data.retakeCooldownHours !== undefined) data.retakeCooldownHours = parsed.data.retakeCooldownHours;
    if (parsed.data.certificateEnabled !== undefined) data.certificateEnabled = parsed.data.certificateEnabled;
    if (parsed.data.certificateValidityDays !== undefined) data.certificateValidityDays = parsed.data.certificateValidityDays;

    const updated = await this.prisma.assessment.update({
      where: { id: assessmentId },
      data,
      select: {
        retakeEnabled: true,
        maximumAttempts: true,
        retakeCooldownHours: true,
        certificateEnabled: true,
        certificateValidityDays: true,
      },
    });

    return updated;
  }
}

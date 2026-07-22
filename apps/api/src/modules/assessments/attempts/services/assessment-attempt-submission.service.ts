import { BadRequestException, Injectable } from '@nestjs/common';
import { ASSESSMENT_ERROR_CODES } from '@nexthire/constants';
import type {
  AssessmentAttemptSubmissionResult,
  SubmitAssessmentAttemptInput,
} from '@nexthire/types';
import { SubmitAssessmentAttemptInputSchema } from '@nexthire/validation';
import { AssessmentAttemptFinalizationService } from './assessment-attempt-finalization.service';

@Injectable()
export class AssessmentAttemptSubmissionService {
  constructor(
    private readonly finalizationService: AssessmentAttemptFinalizationService,
  ) {}

  async submitAttempt(
    candidateId: string,
    attemptId: string,
    input: SubmitAssessmentAttemptInput,
  ): Promise<AssessmentAttemptSubmissionResult> {
    const parsed = SubmitAssessmentAttemptInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(ASSESSMENT_ERROR_CODES.ASSESSMENT_SUBMISSION_CONFIRMATION_INVALID);
    }

    return this.finalizationService.finalizeCandidateSubmission(candidateId, attemptId);
  }

  async getSubmissionSummary(
    candidateId: string,
    attemptId: string,
  ): Promise<AssessmentAttemptSubmissionResult> {
    return this.finalizationService.getSubmissionSummary(candidateId, attemptId);
  }
}

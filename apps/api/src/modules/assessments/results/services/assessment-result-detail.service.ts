import { Injectable, Logger, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { AssessmentResultRepository, AttemptWithFullData } from '../repositories/assessment-result.repository';
import { AssessmentResultMapperService } from './assessment-result-mapper.service';
import { AssessmentResultConsistencyService, ConsistencyCheckResult } from './assessment-result-consistency.service';
import { AuditService } from '../../../audit/audit.service';
import { AuditActorType } from '@nexthire/types';
import { ASSESSMENT_ERROR_CODES } from '@nexthire/constants';
import type { AssessmentAttemptResultDetail } from '@nexthire/types';

@Injectable()
export class AssessmentResultDetailService {
  private readonly logger = new Logger(AssessmentResultDetailService.name);

  constructor(
    private readonly repository: AssessmentResultRepository,
    private readonly mapper: AssessmentResultMapperService,
    private readonly consistencyService: AssessmentResultConsistencyService,
    private readonly auditService: AuditService,
  ) {}

  async getDetail(candidateId: string, attemptId: string): Promise<AssessmentAttemptResultDetail> {
    const attempt = await this.repository.findAttemptByIdAndCandidate(attemptId, candidateId);

    if (!attempt) {
      await this.auditService.recordBestEffort({
        actorType: AuditActorType.USER,
        actorUserId: candidateId,
        action: 'assessment.result.viewed',
        targetType: 'AssessmentAttempt',
        targetId: attemptId,
        metadata: { failureCategory: 'NOT_FOUND' },
      });
      throw new NotFoundException(ASSESSMENT_ERROR_CODES.ASSESSMENT_RESULT_NOT_FOUND);
    }

    if (attempt.status !== 'SUBMITTED' && attempt.status !== 'EXPIRED') {
      await this.auditService.recordBestEffort({
        actorType: AuditActorType.USER,
        actorUserId: candidateId,
        action: 'assessment.result_review.viewed',
        targetType: 'AssessmentAttempt',
        targetId: attemptId,
        metadata: { resultStatus: attempt.resultStatus, finalizationReason: attempt.finalizationReason, failureCategory: 'NOT_FINALIZED' },
      });
      throw new ConflictException(ASSESSMENT_ERROR_CODES.ASSESSMENT_RESULT_NOT_FINALIZED);
    }

    const consistency = this.consistencyService.checkAttemptConsistency(attempt as any);
    if (!consistency.passed) {
      await this.auditService.recordBestEffort({
        actorType: AuditActorType.USER,
        actorUserId: candidateId,
        action: 'assessment.result_consistency_failed',
        targetType: 'AssessmentAttempt',
        targetId: attemptId,
        metadata: {
          resultStatus: attempt.resultStatus,
          finalizationReason: attempt.finalizationReason,
          failureCategory: consistency.failureCategory,
          questionCount: attempt.questionCountSnapshot,
        },
      });
      throw new ConflictException(ASSESSMENT_ERROR_CODES.ASSESSMENT_RESULT_INCONSISTENT);
    }

    const result = this.mapper.toDetailResult(attempt as any);

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: candidateId,
      action: 'assessment.result_review.viewed',
      targetType: 'AssessmentAttempt',
      targetId: attemptId,
      metadata: {
        resultStatus: attempt.resultStatus,
        finalizationReason: attempt.finalizationReason,
        questionCount: attempt.questionCountSnapshot,
        scoringVersion: attempt.scoringVersion,
      },
    });

    return result;
  }
}

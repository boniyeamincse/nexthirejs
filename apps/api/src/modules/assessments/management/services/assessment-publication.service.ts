import { AuditActorType, AuditOutcome } from '@nexthire/types';
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import { AssessmentPublicationReadiness, AssessmentPublicationIssue } from '@nexthire/types';
import { AssessmentStatus, AssessmentAvailability, AssessmentQuestionStatus } from '@nexthire/types';

@Injectable()
export class AssessmentReadinessService {
  private readonly logger = new Logger(AssessmentReadinessService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async checkReadiness(
    actorUserId: string,
    requestId: string,
    assessmentId: string,
  ): Promise<AssessmentPublicationReadiness> {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        category: true,
        sections: {
          include: {
            questions: {
              include: {
                question: true,
              },
            },
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    const blockers: AssessmentPublicationIssue[] = [];
    const warnings: AssessmentPublicationIssue[] = [];

    // 1. Active category required
    if (!assessment.category.isActive) {
      blockers.push({ code: 'CATEGORY_INACTIVE', message: 'The assessment category must be active.' });
    }

    // 2. Required metadata
    if (!assessment.instructions) {
      blockers.push({ code: 'MISSING_INSTRUCTIONS', message: 'Instructions are required for publication.' });
    }

    // 3. At least one section
    if (assessment.sections.length === 0) {
      blockers.push({ code: 'NO_SECTIONS', message: 'At least one section is required.' });
    } else {
      let emptySection = false;
      let hasActiveQuestions = false;

      for (const section of assessment.sections) {
        if (!section.instructions) {
          warnings.push({ code: 'SECTION_MISSING_INSTRUCTIONS', message: `Section '${section.title}' is missing instructions.`, sectionId: section.id });
        }

        // 5. Every section has a question
        if (section.questions.length === 0) {
          emptySection = true;
          blockers.push({ code: 'EMPTY_SECTION', message: `Section '${section.title}' has no questions assigned.`, sectionId: section.id });
        } else {
          hasActiveQuestions = true;
        }

        for (const assignment of section.questions) {
          // 8. Assignment points
          if (assignment.points.toNumber() <= 0) {
            blockers.push({ code: 'INVALID_POINTS', message: 'Question assignment points must be > 0.', sectionId: section.id, questionId: assignment.questionId });
          }

          // 6. Every assigned question is ACTIVE
          if (assignment.question.status !== AssessmentQuestionStatus.ACTIVE) {
            blockers.push({ code: 'INACTIVE_QUESTION', message: `Question is not in ACTIVE status.`, sectionId: section.id, questionId: assignment.questionId });
          }
          
          if (!assignment.question.explanation) {
            warnings.push({ code: 'MISSING_EXPLANATION', message: 'Question is missing an explanation.', sectionId: section.id, questionId: assignment.questionId });
          }
        }
      }

      // 4. At least one assigned question
      if (!hasActiveQuestions && !emptySection) {
        blockers.push({ code: 'NO_QUESTIONS', message: 'At least one assigned question is required.' });
      }
    }

    // 9. Total points > 0
    const totalPoints = assessment.totalPoints.toNumber();
    if (totalPoints <= 0) {
      blockers.push({ code: 'NO_POINTS', message: 'Assessment total points must be > 0.' });
    }

    // 10. Aggregate question count matches (this is self-healing, but good to check)
    const actualQuestionCount = assessment.sections.reduce((acc, s) => acc + s.questions.length, 0);
    if (assessment.questionCount !== actualQuestionCount) {
      blockers.push({ code: 'QUESTION_COUNT_MISMATCH', message: 'Aggregate question count is out of sync.' });
    }

    // 12. Candidate-catalog assessment has compatible visibility
    // Assuming AVAILABLE cannot publish with zero questions
    if (assessment.availability === AssessmentAvailability.AVAILABLE && actualQuestionCount === 0) {
      blockers.push({ code: 'AVAILABLE_NO_QUESTIONS', message: 'Assessment marked as AVAILABLE must have questions.' });
    }

    // 14. Retired assessment cannot republish
    if (assessment.status === AssessmentStatus.RETIRED) {
      blockers.push({ code: 'RETIRED', message: 'A retired assessment cannot be republished.' });
    }
    
    // Warnings - low duration relative to question count
    if (actualQuestionCount > 0 && assessment.estimatedDurationMinutes < Math.ceil(actualQuestionCount * 0.5)) {
      warnings.push({ code: 'LOW_DURATION', message: 'Estimated duration seems low for the number of questions.' });
    }

    const readiness: AssessmentPublicationReadiness = {
      ready: blockers.length === 0,
      blockers,
      warnings,
      summary: {
        sectionCount: assessment.sections.length,
        questionCount: actualQuestionCount,
        totalPoints,
        estimatedDurationMinutes: assessment.estimatedDurationMinutes,
      },
    };

    await this.audit.recordRequired({
      actorType: AuditActorType.USER, outcome: AuditOutcome.SUCCESS,
      action: 'assessment.readiness_checked',
      actorUserId,
      requestId,
      targetId: assessmentId,
      targetType: 'Assessment',
      metadata: {
        isReady: readiness.ready,
        blockerCount: blockers.length,
        warningCount: warnings.length,
      },
    });

    return readiness;
  }
}

@Injectable()
export class AssessmentPublicationService {
  private readonly logger = new Logger(AssessmentPublicationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly readiness: AssessmentReadinessService,
  ) {}

  async publishAssessment(actorUserId: string, requestId: string, assessmentId: string) {
    const assessment = await this.prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) throw new NotFoundException('Assessment not found');

    if (assessment.status === AssessmentStatus.PUBLISHED) {
      throw new BadRequestException('Assessment is already PUBLISHED');
    }
    if (assessment.status === AssessmentStatus.RETIRED) {
      throw new BadRequestException('Cannot publish a RETIRED assessment');
    }

    const readinessResult = await this.readiness.checkReadiness(actorUserId, requestId, assessmentId);
    if (!readinessResult.ready) {
      throw new BadRequestException({
        message: 'Assessment is not ready for publication',
        blockers: readinessResult.blockers,
      });
    }

    const updated = await this.prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        status: AssessmentStatus.PUBLISHED,
        publishedAt: assessment.publishedAt || new Date(), // Set only the first time
        archivedAt: null,
        publicationVersion: assessment.publicationVersion + 1,
        updatedById: actorUserId,
      },
    });

    await this.audit.recordRequired({
      actorType: AuditActorType.USER, outcome: AuditOutcome.SUCCESS,
      action: assessment.status === AssessmentStatus.ARCHIVED ? 'assessment.republished' : 'assessment.published',
      actorUserId,
      requestId,
      targetId: assessmentId,
      targetType: 'Assessment',
      metadata: {
        publicationVersion: updated.publicationVersion,
        statusBefore: assessment.status,
        statusAfter: updated.status,
      },
    });

    return updated;
  }

  async archiveAssessment(actorUserId: string, requestId: string, assessmentId: string) {
    const assessment = await this.prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) throw new NotFoundException('Assessment not found');

    if (assessment.status !== AssessmentStatus.PUBLISHED) {
      throw new BadRequestException('Only a PUBLISHED assessment can be ARCHIVED');
    }

    const updated = await this.prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        status: AssessmentStatus.ARCHIVED,
        archivedAt: new Date(),
        updatedById: actorUserId,
      },
    });

    await this.audit.recordRequired({
      actorType: AuditActorType.USER, outcome: AuditOutcome.SUCCESS,
      action: 'assessment.archived',
      actorUserId,
      requestId,
      targetId: assessmentId,
      targetType: 'Assessment',
      metadata: {
        statusBefore: assessment.status,
        statusAfter: updated.status,
      },
    });

    return updated;
  }
}

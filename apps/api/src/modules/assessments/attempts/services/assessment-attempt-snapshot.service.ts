import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { AssessmentAttemptStatus, AssessmentQuestionType } from '@nexthire/types';
import { ASSESSMENT_ERROR_CODES } from '@nexthire/constants';
import { AssessmentReadinessService } from '../../management/services/assessment-publication.service';
import { RequestContextService } from '../../../../common/request-context';

@Injectable()
export class AssessmentAttemptSnapshotService {
  private readonly logger = new Logger(AssessmentAttemptSnapshotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly readinessService: AssessmentReadinessService,
    private readonly requestContextService: RequestContextService,
  ) {}

  async createSnapshotTransactionally(
    candidateId: string,
    assessmentId: string,
  ): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Lock the assessment or simply read it
      const assessment = await tx.assessment.findUnique({
        where: { id: assessmentId, status: 'PUBLISHED', availability: 'AVAILABLE' },
        include: {
          category: true,
          sections: {
            orderBy: { sortOrder: 'asc' },
            include: {
              questions: {
                orderBy: { sortOrder: 'asc' },
                include: {
                  question: {
                    include: {
                      options: { orderBy: { sortOrder: 'asc' } },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!assessment || !assessment.category.isActive) {
        throw new NotFoundException(ASSESSMENT_ERROR_CODES.ASSESSMENT_NOT_FOUND);
      }

      // 2. Re-run readiness validation
      const requestId = this.requestContextService.getRequestId() || 'system-snapshot';
      const readiness = await this.readinessService.checkReadiness(candidateId, requestId, assessmentId);
      if (!readiness.ready) {
        this.logger.error(`Assessment ${assessmentId} is not ready for attempts:`, readiness.blockers);
        throw new ConflictException(ASSESSMENT_ERROR_CODES.ASSESSMENT_SNAPSHOT_INCONSISTENT);
      }

      // 3. Confirm no active attempt exists
      const existingActive = await tx.assessmentAttempt.findFirst({
        where: {
          candidateId,
          assessmentId,
          status: 'IN_PROGRESS',
        },
      });

      if (existingActive) {
        throw new ConflictException(ASSESSMENT_ERROR_CODES.ASSESSMENT_ATTEMPT_ALREADY_ACTIVE);
      }

      // 4. Calculate attempt number
      const lastAttempt = await tx.assessmentAttempt.findFirst({
        where: { candidateId, assessmentId },
        orderBy: { attemptNumber: 'desc' },
        select: { attemptNumber: true },
      });
      const attemptNumber = (lastAttempt?.attemptNumber ?? 0) + 1;

      // 5. Calculate deadline
      const now = new Date();
      const durationMinutes = assessment.estimatedDurationMinutes;
      const deadlineAt = new Date(now.getTime() + durationMinutes * 60000);

      // 6. Create attempt
      const attempt = await tx.assessmentAttempt.create({
        data: {
          assessmentId,
          candidateId,
          attemptNumber,
          assessmentPublicationVersion: assessment.publicationVersion,
          assessmentTitleSnapshot: assessment.title,
          assessmentSlugSnapshot: assessment.slug,
          instructionsSnapshot: assessment.instructions,
          durationMinutesSnapshot: durationMinutes,
          passingScoreSnapshot: assessment.passingScorePercentage,
          totalPointsSnapshot: assessment.totalPoints,
          questionCountSnapshot: assessment.questionCount,
          status: 'IN_PROGRESS',
          startedAt: now,
          deadlineAt,
          lastActivityAt: now,
        },
      });

      // 7. Copy ordered sections and questions
      for (const section of assessment.sections) {
        const attemptSection = await tx.assessmentAttemptSection.create({
          data: {
            attemptId: attempt.id,
            sourceSectionId: section.id,
            titleSnapshot: section.title,
            descriptionSnapshot: section.description,
            instructionsSnapshot: section.instructions,
            sortOrder: section.sortOrder,
            isRequired: section.isRequired,
          },
        });

        for (const assignment of section.questions) {
          const q = assignment.question;
          
          const attemptQuestion = await tx.assessmentAttemptQuestion.create({
            data: {
              attemptId: attempt.id,
              attemptSectionId: attemptSection.id,
              sourceQuestionId: q.id,
              typeSnapshot: q.type as AssessmentQuestionType,
              promptSnapshot: q.prompt,
              explanationSnapshot: q.explanation,
              acceptedAnswersJson: q.acceptedAnswers?.length ? q.acceptedAnswers : undefined,
              pointsSnapshot: assignment.points,
              isRequired: assignment.isRequired,
              sortOrder: assignment.sortOrder,
            },
          });

          // 7. Copy options
          if (q.options && q.options.length > 0) {
            await tx.assessmentAttemptQuestionOption.createMany({
              data: q.options.map((opt) => ({
                attemptQuestionId: attemptQuestion.id,
                sourceOptionId: opt.id,
                labelSnapshot: opt.label,
                isCorrectSnapshot: opt.isCorrect,
                sortOrder: opt.sortOrder,
              })),
            });
          }
        }
      }

      // 8. Verify copied question count and points
      const createdQuestionsAgg = await tx.assessmentAttemptQuestion.aggregate({
        where: { attemptId: attempt.id },
        _count: { id: true },
        _sum: { pointsSnapshot: true },
      });

      if (
        createdQuestionsAgg._count.id !== assessment.questionCount ||
        (createdQuestionsAgg._sum.pointsSnapshot?.toNumber() || 0) !== assessment.totalPoints.toNumber()
      ) {
        this.logger.error(`Snapshot reconciliation failed for attempt ${attempt.id}`);
        throw new ConflictException(ASSESSMENT_ERROR_CODES.ASSESSMENT_SNAPSHOT_INCONSISTENT);
      }

      return attempt.id;
    });
  }
}

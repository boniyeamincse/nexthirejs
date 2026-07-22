import { AuditActorType, AuditOutcome } from '@nexthire/types';
import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import { AssignAssessmentQuestionsInput, UpdateAssessmentQuestionAssignmentInput } from '@nexthire/types';
import { assignAssessmentQuestionsSchema, updateAssessmentQuestionAssignmentSchema, reorderAssessmentSectionQuestionsSchema } from '@nexthire/validation';
import { AssessmentStatus, AssessmentQuestionStatus } from '@nexthire/types';

@Injectable()
export class AssessmentAssignmentService {
  private readonly logger = new Logger(AssessmentAssignmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private async assertAssessmentEditable(assessmentId: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { status: true },
    });
    if (!assessment) throw new NotFoundException('Assessment not found');
    if (assessment.status === AssessmentStatus.PUBLISHED) {
      throw new BadRequestException('Cannot edit assignments of a PUBLISHED assessment. Archive it first.');
    }
    if (assessment.status === AssessmentStatus.RETIRED) {
      throw new BadRequestException('Cannot edit assignments of a RETIRED assessment.');
    }
    return assessment;
  }

  async assignQuestions(
    actorUserId: string,
    requestId: string,
    assessmentId: string,
    input: AssignAssessmentQuestionsInput,
  ) {
    const validated = assignAssessmentQuestionsSchema.safeParse(input);
    if (!validated.success) {
      throw new BadRequestException({ message: 'Validation failed', errors: validated.error.errors });
    }
    const { sectionId, questionIds, points, isRequired } = validated.data;

    await this.assertAssessmentEditable(assessmentId);

    // Verify section exists and belongs to assessment
    const section = await this.prisma.assessmentSection.findUnique({ where: { id: sectionId } });
    if (!section || section.assessmentId !== assessmentId) {
      throw new NotFoundException('Section not found');
    }

    // Verify total questions limit
    const currentCount = await this.prisma.assessmentQuestionAssignment.count({ where: { assessmentId } });
    if (currentCount + questionIds.length > 500) {
      throw new BadRequestException('Maximum 500 questions allowed per assessment.');
    }

    // Process each question
    await this.prisma.$transaction(async (tx) => {
      for (const questionId of questionIds) {
        // Verify question exists and is ACTIVE
        const question = await tx.assessmentQuestion.findUnique({ where: { id: questionId } });
        if (!question) throw new NotFoundException(`Question ${questionId} not found`);
        if (question.status !== AssessmentQuestionStatus.ACTIVE) {
          throw new BadRequestException(`Question ${questionId} is not ACTIVE.`);
        }

        // Verify not already assigned
        const existing = await tx.assessmentQuestionAssignment.findUnique({
          where: { assessmentId_questionId: { assessmentId, questionId } },
        });
        if (existing) {
          throw new ConflictException(`Question ${questionId} is already assigned to this assessment.`);
        }

        // Get max order in section
        const maxOrderAgg = await tx.assessmentQuestionAssignment.aggregate({
          where: { sectionId },
          _max: { sortOrder: true },
        });
        const currentMax = maxOrderAgg._max.sortOrder ?? 0;

        await tx.assessmentQuestionAssignment.create({
          data: {
            assessmentId,
            sectionId,
            questionId,
            points,
            isRequired: isRequired ?? true,
            sortOrder: currentMax + 1,
          },
        });
      }

      // Update aggregate fields
      const totalPoints = await tx.assessmentQuestionAssignment.aggregate({
        where: { assessmentId },
        _sum: { points: true },
      });
      const questionCount = await tx.assessmentQuestionAssignment.count({
        where: { assessmentId },
      });

      await tx.assessment.update({
        where: { id: assessmentId },
        data: {
          totalPoints: totalPoints._sum.points ?? 0,
          questionCount,
        },
      });
    });

    await this.audit.recordRequired({
      actorType: AuditActorType.USER, outcome: AuditOutcome.SUCCESS,
      action: 'assessment.question.assigned',
      actorUserId,
      requestId,
      targetId: assessmentId,
      targetType: 'Assessment',
      metadata: { sectionId, questionIdsAssigned: questionIds },
    });
  }

  async updateAssignment(
    actorUserId: string,
    requestId: string,
    assessmentId: string,
    assignmentId: string,
    input: UpdateAssessmentQuestionAssignmentInput,
  ) {
    const validated = updateAssessmentQuestionAssignmentSchema.safeParse(input);
    if (!validated.success) {
      throw new BadRequestException({ message: 'Validation failed', errors: validated.error.errors });
    }

    await this.assertAssessmentEditable(assessmentId);

    const existing = await this.prisma.assessmentQuestionAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (!existing || existing.assessmentId !== assessmentId) {
      throw new NotFoundException('Assignment not found');
    }

    if (validated.data.sectionId && validated.data.sectionId !== existing.sectionId) {
      const section = await this.prisma.assessmentSection.findUnique({ where: { id: validated.data.sectionId } });
      if (!section || section.assessmentId !== assessmentId) throw new NotFoundException('Target section not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      let nextSortOrder = existing.sortOrder;
      
      // If moving to a new section, update sort order to the end of that section
      if (validated.data.sectionId && validated.data.sectionId !== existing.sectionId) {
        const maxOrderAgg = await tx.assessmentQuestionAssignment.aggregate({
          where: { sectionId: validated.data.sectionId },
          _max: { sortOrder: true },
        });
        nextSortOrder = (maxOrderAgg._max.sortOrder ?? 0) + 1;
      }

      const res = await tx.assessmentQuestionAssignment.update({
        where: { id: assignmentId },
        data: {
          ...validated.data,
          sortOrder: nextSortOrder,
        },
      });

      // Update aggregate fields
      const totalPoints = await tx.assessmentQuestionAssignment.aggregate({
        where: { assessmentId },
        _sum: { points: true },
      });

      await tx.assessment.update({
        where: { id: assessmentId },
        data: {
          totalPoints: totalPoints._sum.points ?? 0,
        },
      });

      return res;
    });

    await this.audit.recordRequired({
      actorType: AuditActorType.USER, outcome: AuditOutcome.SUCCESS,
      action: 'assessment.question.assignment_updated',
      actorUserId,
      requestId,
      targetId: assessmentId,
      targetType: 'Assessment',
      metadata: { assignmentId, changedFields: Object.keys(validated.data) },
    });

    return updated;
  }

  async removeAssignment(
    actorUserId: string,
    requestId: string,
    assessmentId: string,
    assignmentId: string,
  ) {
    await this.assertAssessmentEditable(assessmentId);

    const existing = await this.prisma.assessmentQuestionAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (!existing || existing.assessmentId !== assessmentId) {
      throw new NotFoundException('Assignment not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.assessmentQuestionAssignment.delete({ where: { id: assignmentId } });

      const totalPoints = await tx.assessmentQuestionAssignment.aggregate({
        where: { assessmentId },
        _sum: { points: true },
      });
      const questionCount = await tx.assessmentQuestionAssignment.count({
        where: { assessmentId },
      });

      await tx.assessment.update({
        where: { id: assessmentId },
        data: {
          totalPoints: totalPoints._sum.points ?? 0,
          questionCount,
        },
      });
    });

    await this.audit.recordRequired({
      actorType: AuditActorType.USER, outcome: AuditOutcome.SUCCESS,
      action: 'assessment.question.unassigned',
      actorUserId,
      requestId,
      targetId: assessmentId,
      targetType: 'Assessment',
      metadata: { assignmentId, questionId: existing.questionId },
    });
  }

  async reorderSectionQuestions(
    actorUserId: string,
    requestId: string,
    assessmentId: string,
    sectionId: string,
    orderedIds: string[],
  ) {
    const validated = reorderAssessmentSectionQuestionsSchema.safeParse({ orderedIds });
    if (!validated.success) {
      throw new BadRequestException({ message: 'Validation failed', errors: validated.error.errors });
    }

    await this.assertAssessmentEditable(assessmentId);

    const section = await this.prisma.assessmentSection.findUnique({ where: { id: sectionId } });
    if (!section || section.assessmentId !== assessmentId) throw new NotFoundException('Section not found');

    const existingAssignments = await this.prisma.assessmentQuestionAssignment.findMany({
      where: { sectionId },
    });

    if (existingAssignments.length !== orderedIds.length) {
      throw new BadRequestException('Must provide all assignment IDs for reordering');
    }
    const existingIds = existingAssignments.map((a) => a.id);
    for (const id of orderedIds) {
      if (!existingIds.includes(id)) {
        throw new BadRequestException(`Assignment ID ${id} does not belong to this section`);
      }
    }

    if (new Set(orderedIds).size !== orderedIds.length) {
      throw new BadRequestException('Duplicate assignment IDs provided');
    }

    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx.assessmentQuestionAssignment.update({
          where: { id: orderedIds[i] },
          data: { sortOrder: i + 1 },
        });
      }
    });

    await this.audit.recordRequired({
      actorType: AuditActorType.USER, outcome: AuditOutcome.SUCCESS,
      action: 'assessment.question.reordered',
      actorUserId,
      requestId,
      targetId: assessmentId,
      targetType: 'Assessment',
      metadata: { sectionId },
    });
  }
}

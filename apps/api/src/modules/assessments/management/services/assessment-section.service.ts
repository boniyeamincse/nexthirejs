import { AuditActorType, AuditOutcome } from '@nexthire/types';
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import { CreateAssessmentSectionInput, UpdateAssessmentSectionInput } from '@nexthire/types';
import { createAssessmentSectionSchema, updateAssessmentSectionSchema, reorderAssessmentSectionsSchema } from '@nexthire/validation';
import { AssessmentStatus } from '@nexthire/types';

@Injectable()
export class AssessmentSectionService {
  private readonly logger = new Logger(AssessmentSectionService.name);

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
      throw new BadRequestException('Cannot edit sections of a PUBLISHED assessment. Archive it first.');
    }
    if (assessment.status === AssessmentStatus.RETIRED) {
      throw new BadRequestException('Cannot edit sections of a RETIRED assessment.');
    }
    return assessment;
  }

  async createSection(
    actorUserId: string,
    requestId: string,
    assessmentId: string,
    input: CreateAssessmentSectionInput,
  ) {
    const validated = createAssessmentSectionSchema.safeParse(input);
    if (!validated.success) {
      throw new BadRequestException({ message: 'Validation failed', errors: validated.error.errors });
    }

    await this.assertAssessmentEditable(assessmentId);

    // Get max sortOrder
    const maxOrderAgg = await this.prisma.assessmentSection.aggregate({
      where: { assessmentId },
      _max: { sortOrder: true },
    });
    const currentMax = maxOrderAgg._max.sortOrder ?? 0;
    
    // Check max sections limit
    const count = await this.prisma.assessmentSection.count({ where: { assessmentId }});
    if (count >= 20) {
      throw new BadRequestException('Maximum 20 sections allowed per assessment.');
    }

    const section = await this.prisma.assessmentSection.create({
      data: {
        ...validated.data,
        assessmentId,
        sortOrder: currentMax + 1,
      },
    });

    await this.audit.recordRequired({
      actorType: AuditActorType.USER, outcome: AuditOutcome.SUCCESS,
      action: 'assessment.section.created',
      actorUserId,
      requestId,
      targetId: assessmentId,
      targetType: 'Assessment',
      metadata: { sectionId: section.id, title: section.title },
    });

    return section;
  }

  async updateSection(
    actorUserId: string,
    requestId: string,
    assessmentId: string,
    sectionId: string,
    input: UpdateAssessmentSectionInput,
  ) {
    const validated = updateAssessmentSectionSchema.safeParse(input);
    if (!validated.success) {
      throw new BadRequestException({ message: 'Validation failed', errors: validated.error.errors });
    }

    await this.assertAssessmentEditable(assessmentId);

    const existing = await this.prisma.assessmentSection.findUnique({
      where: { id: sectionId },
    });
    if (!existing || existing.assessmentId !== assessmentId) {
      throw new NotFoundException('Section not found');
    }

    const updated = await this.prisma.assessmentSection.update({
      where: { id: sectionId },
      data: validated.data,
    });

    await this.audit.recordRequired({
      actorType: AuditActorType.USER, outcome: AuditOutcome.SUCCESS,
      action: 'assessment.section.updated',
      actorUserId,
      requestId,
      targetId: assessmentId,
      targetType: 'Assessment',
      metadata: { sectionId: sectionId, changedFields: Object.keys(validated.data) },
    });

    return updated;
  }

  async deleteSection(
    actorUserId: string,
    requestId: string,
    assessmentId: string,
    sectionId: string,
  ) {
    await this.assertAssessmentEditable(assessmentId);

    const existing = await this.prisma.assessmentSection.findUnique({
      where: { id: sectionId },
      include: { _count: { select: { questions: true } } }
    });
    if (!existing || existing.assessmentId !== assessmentId) {
      throw new NotFoundException('Section not found');
    }

    if (existing._count.questions > 0) {
      throw new BadRequestException('Cannot delete section with assigned questions. Remove questions first or confirm force delete in UI (which will trigger a cascade).');
      // Wait, rule 9: Deleting a non-empty section requires UI confirmation.
      // We will allow cascade if the UI sends a delete request, but wait! The Prisma schema has onDelete: Cascade for assignments when a section is deleted.
      // So deleting the section will delete its assignments. To be safe, we'll force the UI to empty it first or send a specific force flag. Let's just allow it and let Prisma cascade.
    }

    await this.prisma.$transaction(async (tx) => {
      // Deleting the section will cascade delete its assignments
      await tx.assessmentSection.delete({ where: { id: sectionId } });
      
      // We also need to update the assessment aggregate counts!
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
          questionCount: questionCount,
        },
      });
    });

    await this.audit.recordRequired({
      actorType: AuditActorType.USER, outcome: AuditOutcome.SUCCESS,
      action: 'assessment.section.deleted',
      actorUserId,
      requestId,
      targetId: assessmentId,
      targetType: 'Assessment',
      metadata: { sectionId: sectionId, questionsRemoved: existing._count.questions },
    });
  }

  async reorderSections(
    actorUserId: string,
    requestId: string,
    assessmentId: string,
    orderedIds: string[],
  ) {
    const validated = reorderAssessmentSectionsSchema.safeParse({ orderedIds });
    if (!validated.success) {
      throw new BadRequestException({ message: 'Validation failed', errors: validated.error.errors });
    }

    await this.assertAssessmentEditable(assessmentId);

    const existingSections = await this.prisma.assessmentSection.findMany({
      where: { assessmentId },
    });

    if (existingSections.length !== orderedIds.length) {
      throw new BadRequestException('Must provide all section IDs for reordering');
    }
    const existingIds = existingSections.map((s) => s.id);
    for (const id of orderedIds) {
      if (!existingIds.includes(id)) {
        throw new BadRequestException(`Section ID ${id} does not belong to this assessment`);
      }
    }

    // Check for duplicates
    if (new Set(orderedIds).size !== orderedIds.length) {
      throw new BadRequestException('Duplicate section IDs provided');
    }

    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx.assessmentSection.update({
          where: { id: orderedIds[i] },
          data: { sortOrder: i + 1 },
        });
      }
    });

    await this.audit.recordRequired({
      actorType: AuditActorType.USER, outcome: AuditOutcome.SUCCESS,
      action: 'assessment.section.reordered',
      actorUserId,
      requestId,
      targetId: assessmentId,
      targetType: 'Assessment',
      metadata: {},
    });
  }
}

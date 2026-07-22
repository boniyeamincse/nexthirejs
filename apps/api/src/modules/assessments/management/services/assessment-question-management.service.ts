
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import {
  CreateAssessmentQuestionInput,
  UpdateAssessmentQuestionInput,
  AssessmentQuestionManagementItem,
  AssessmentQuestionManagementDetail,
  AssessmentQuestionListQuery,
  PaginatedAssessmentQuestionResult,
  AuditActorType,
  AuditOutcome,
} from '@nexthire/types';
import {
  AssessmentQuestionType,
  AssessmentQuestionStatus,
  AssessmentDifficulty,
} from '@nexthire/types';
import { createAssessmentQuestionSchema, updateAssessmentQuestionSchema, assessmentQuestionListQuerySchema } from '@nexthire/validation';

@Injectable()
export class AssessmentQuestionManagementService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async listQuestions(query: AssessmentQuestionListQuery): Promise<PaginatedAssessmentQuestionResult> {
    const parsed = assessmentQuestionListQuerySchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException('INVALID_LIST_QUERY');
    const validQuery = parsed.data;

    const page = validQuery.page || 1;
    const pageSize = validQuery.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (validQuery.categoryId) {
      where.categoryId = validQuery.categoryId;
    }
    if (validQuery.type) {
      where.type = validQuery.type;
    }
    if (validQuery.difficulty) {
      where.difficulty = validQuery.difficulty;
    }
    if (validQuery.status) {
      where.status = validQuery.status;
    }
    if (validQuery.tag) {
      where.tags = { has: validQuery.tag.toLowerCase() };
    }
    if (validQuery.search) {
      where.prompt = { contains: validQuery.search, mode: 'insensitive' };
    }

    const [items, totalItems] = await Promise.all([
      this.prisma.assessmentQuestion.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        skip,
        take: pageSize,
      }),
      this.prisma.assessmentQuestion.count({ where }),
    ]);

    const mappedItems: AssessmentQuestionManagementItem[] = items.map(q => ({
      id: q.id,
      categoryId: q.categoryId,
      type: q.type as AssessmentQuestionType,
      status: q.status as AssessmentQuestionStatus,
      difficulty: q.difficulty as AssessmentDifficulty,
      prompt: q.prompt,
      tags: q.tags,
      estimatedSeconds: q.estimatedSeconds,
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
    }));

    return {
      items: mappedItems,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
  }

  async getQuestion(id: string): Promise<AssessmentQuestionManagementDetail> {
    const question = await this.prisma.assessmentQuestion.findUnique({
      where: { id },
      include: { options: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!question) {
      throw new NotFoundException('ASSESSMENT_QUESTION_NOT_FOUND');
    }

    return {
      id: question.id,
      categoryId: question.categoryId,
      type: question.type as AssessmentQuestionType,
      status: question.status as AssessmentQuestionStatus,
      difficulty: question.difficulty as AssessmentDifficulty,
      prompt: question.prompt,
      explanation: question.explanation,
      acceptedAnswers: question.acceptedAnswers,
      tags: question.tags,
      sourceReference: question.sourceReference,
      estimatedSeconds: question.estimatedSeconds,
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt.toISOString(),
      options: question.options.map(o => ({
        id: o.id,
        label: o.label,
        isCorrect: o.isCorrect,
        sortOrder: o.sortOrder,
      })),
    };
  }

  async createQuestion(input: CreateAssessmentQuestionInput, actorId: string): Promise<AssessmentQuestionManagementDetail> {
    const parsed = createAssessmentQuestionSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException('INVALID_QUESTION_INPUT');
    const validData = parsed.data;

    const category = await this.prisma.assessmentCategory.findUnique({ where: { id: validData.categoryId } });
    if (!category) {
      throw new NotFoundException('ASSESSMENT_CATEGORY_NOT_FOUND');
    }
    if (!category.isActive && validData.status === AssessmentQuestionStatus.ACTIVE) {
      throw new BadRequestException('ASSESSMENT_QUESTION_TRANSITION_INVALID');
    }

    const question = await this.prisma.$transaction(async (tx) => {
      const q = await tx.assessmentQuestion.create({
        data: {
          categoryId: validData.categoryId,
          type: validData.type,
          difficulty: validData.difficulty,
          prompt: validData.prompt,
          explanation: validData.explanation,
          acceptedAnswers: validData.acceptedAnswers || [],
          tags: validData.tags ? validData.tags.map(t => t.toLowerCase()) : [],
          sourceReference: validData.sourceReference,
          estimatedSeconds: validData.estimatedSeconds,
          status: validData.status || AssessmentQuestionStatus.DRAFT,
          createdById: actorId,
          updatedById: actorId,
        },
      });

      if (validData.options && validData.options.length > 0) {
        await tx.assessmentQuestionOption.createMany({
          data: validData.options.map((o) => ({
            questionId: q.id,
            label: o.label,
            isCorrect: o.isCorrect,
            sortOrder: o.sortOrder,
          })),
        });
      }

      return tx.assessmentQuestion.findUnique({
        where: { id: q.id },
        include: { options: { orderBy: { sortOrder: 'asc' } } },
      });
    });

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: actorId,
      action: 'assessment.question.created',
      targetType: 'AssessmentQuestion',
      outcome: AuditOutcome.SUCCESS,
      metadata: { 
        questionId: question!.id, 
        categoryId: question!.categoryId, 
        questionType: question!.type,
        optionCount: question!.options.length,
        tagCount: question!.tags.length,
      },
    });

    return this.getQuestion(question!.id);
  }

  async updateQuestion(id: string, input: UpdateAssessmentQuestionInput, actorId: string): Promise<AssessmentQuestionManagementDetail> {
    const parsed = updateAssessmentQuestionSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException('INVALID_QUESTION_INPUT');
    const validData = parsed.data;

    const existing = await this.prisma.assessmentQuestion.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('ASSESSMENT_QUESTION_NOT_FOUND');
    }

    if (validData.categoryId && validData.categoryId !== existing.categoryId) {
      const category = await this.prisma.assessmentCategory.findUnique({ where: { id: validData.categoryId } });
      if (!category) {
        throw new NotFoundException('ASSESSMENT_CATEGORY_NOT_FOUND');
      }
      if (!category.isActive && (validData.status === AssessmentQuestionStatus.ACTIVE || existing.status === AssessmentQuestionStatus.ACTIVE)) {
        throw new BadRequestException('ASSESSMENT_QUESTION_TRANSITION_INVALID');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      // Clean up previous options if new options are provided
      if (validData.options) {
        await tx.assessmentQuestionOption.deleteMany({
          where: { questionId: id },
        });

        await tx.assessmentQuestionOption.createMany({
          data: validData.options.map((o) => ({
            questionId: id,
            label: o.label,
            isCorrect: o.isCorrect,
            sortOrder: o.sortOrder,
          })),
        });
      }

      await tx.assessmentQuestion.update({
        where: { id },
        data: {
          categoryId: validData.categoryId !== undefined ? validData.categoryId : undefined,
          type: validData.type !== undefined ? validData.type : undefined,
          difficulty: validData.difficulty !== undefined ? validData.difficulty : undefined,
          prompt: validData.prompt !== undefined ? validData.prompt : undefined,
          explanation: validData.explanation !== undefined ? validData.explanation : undefined,
          acceptedAnswers: validData.acceptedAnswers !== undefined ? validData.acceptedAnswers : undefined,
          tags: validData.tags !== undefined ? validData.tags.map(t => t.toLowerCase()) : undefined,
          sourceReference: validData.sourceReference !== undefined ? validData.sourceReference : undefined,
          estimatedSeconds: validData.estimatedSeconds !== undefined ? validData.estimatedSeconds : undefined,
          status: validData.status !== undefined ? validData.status : undefined,
          updatedById: actorId,
        },
      });
    });

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: actorId,
      action: 'assessment.question.updated',
      targetType: 'AssessmentQuestion',
      outcome: AuditOutcome.SUCCESS,
      metadata: { 
        questionId: id,
        changedFieldNames: Object.keys(input),
      },
    });

    return this.getQuestion(id);
  }

  async archiveQuestion(id: string, actorId: string): Promise<AssessmentQuestionManagementDetail> {
    const existing = await this.prisma.assessmentQuestion.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('ASSESSMENT_QUESTION_NOT_FOUND');
    }
    if (existing.status === AssessmentQuestionStatus.ARCHIVED) {
      return this.getQuestion(id);
    }

    await this.prisma.assessmentQuestion.update({
      where: { id },
      data: {
        status: AssessmentQuestionStatus.ARCHIVED,
        archivedAt: new Date(),
        updatedById: actorId,
      },
    });

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: actorId,
      action: 'assessment.question.archived',
      targetType: 'AssessmentQuestion',
      outcome: AuditOutcome.SUCCESS,
      metadata: { questionId: id },
    });

    return this.getQuestion(id);
  }

  async restoreQuestion(id: string, actorId: string): Promise<AssessmentQuestionManagementDetail> {
    const existing = await this.prisma.assessmentQuestion.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('ASSESSMENT_QUESTION_NOT_FOUND');
    }
    if (existing.status !== AssessmentQuestionStatus.ARCHIVED) {
      throw new BadRequestException('ASSESSMENT_QUESTION_TRANSITION_INVALID');
    }

    await this.prisma.assessmentQuestion.update({
      where: { id },
      data: {
        status: AssessmentQuestionStatus.ACTIVE,
        archivedAt: null,
        updatedById: actorId,
      },
    });

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: actorId,
      action: 'assessment.question.restored',
      targetType: 'AssessmentQuestion',
      outcome: AuditOutcome.SUCCESS,
      metadata: { questionId: id },
    });

    return this.getQuestion(id);
  }
}

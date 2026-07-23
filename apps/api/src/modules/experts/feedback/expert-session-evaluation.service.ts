import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import type {
  CreateExpertSessionEvaluationInput,
  ExpertSessionEvaluationResult,
} from '@nexthire/types';
import { EXPERT_FEEDBACK_ERROR_CODES } from '@nexthire/constants';

interface EvaluationRecord {
  id: string;
  bookingId: string;
  expertUserId: string;
  candidateId: string;
  communication: number;
  technicalKnowledge: number;
  confidence: number;
  problemSolving: number;
  overallScore: number;
  strengths: string | null;
  improvements: string | null;
  nextSteps: string | null;
  submittedAt: Date;
  createdAt: Date;
}

@Injectable()
export class ExpertSessionEvaluationService {
  private readonly logger = new Logger(ExpertSessionEvaluationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createForExpert(
    expertUserId: string,
    bookingId: string,
    input: CreateExpertSessionEvaluationInput,
  ): Promise<ExpertSessionEvaluationResult> {
    const booking = await this.prisma.expertBooking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.expertUserId !== expertUserId) {
      throw new NotFoundException(EXPERT_FEEDBACK_ERROR_CODES.BOOKING_NOT_FOUND);
    }
    if (booking.status !== 'COMPLETED') {
      throw new BadRequestException({
        code: EXPERT_FEEDBACK_ERROR_CODES.BOOKING_NOT_COMPLETED,
        message: 'Booking must be completed before it can be evaluated',
      });
    }

    const existing = await this.prisma.expertSessionEvaluation.findUnique({ where: { bookingId } });
    if (existing) {
      throw new BadRequestException(EXPERT_FEEDBACK_ERROR_CODES.ALREADY_SUBMITTED);
    }

    const overallScore = Math.round(
      (input.communication + input.technicalKnowledge + input.confidence + input.problemSolving) /
        4,
    );

    const evaluation = await this.prisma.expertSessionEvaluation.create({
      data: {
        bookingId,
        expertUserId,
        candidateId: booking.candidateId,
        communication: input.communication,
        technicalKnowledge: input.technicalKnowledge,
        confidence: input.confidence,
        problemSolving: input.problemSolving,
        overallScore,
        strengths: input.strengths ?? null,
        improvements: input.improvements ?? null,
        nextSteps: input.nextSteps ?? null,
        submittedAt: new Date(),
      },
    });

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: expertUserId,
      action: 'expert.session_evaluation.created',
      targetType: 'ExpertSessionEvaluation',
      targetId: evaluation.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { bookingId, overallScore },
    });

    this.logger.log(`Evaluation ${evaluation.id} submitted for booking ${bookingId}`);

    return this.mapEvaluation(evaluation);
  }

  async getForExpert(
    expertUserId: string,
    bookingId: string,
  ): Promise<ExpertSessionEvaluationResult | null> {
    const booking = await this.prisma.expertBooking.findUnique({
      where: { id: bookingId },
      select: { expertUserId: true },
    });
    if (!booking || booking.expertUserId !== expertUserId) {
      throw new NotFoundException(EXPERT_FEEDBACK_ERROR_CODES.BOOKING_NOT_FOUND);
    }
    const evaluation = await this.prisma.expertSessionEvaluation.findUnique({
      where: { bookingId },
    });
    return evaluation ? this.mapEvaluation(evaluation) : null;
  }

  async getForCandidate(
    candidateId: string,
    bookingId: string,
  ): Promise<ExpertSessionEvaluationResult | null> {
    const booking = await this.prisma.expertBooking.findUnique({
      where: { id: bookingId },
      select: { candidateId: true },
    });
    if (!booking || booking.candidateId !== candidateId) {
      throw new NotFoundException(EXPERT_FEEDBACK_ERROR_CODES.BOOKING_NOT_FOUND);
    }
    const evaluation = await this.prisma.expertSessionEvaluation.findUnique({
      where: { bookingId },
    });
    return evaluation ? this.mapEvaluation(evaluation) : null;
  }

  private mapEvaluation(record: EvaluationRecord): ExpertSessionEvaluationResult {
    return {
      id: record.id,
      bookingId: record.bookingId,
      expertUserId: record.expertUserId,
      candidateId: record.candidateId,
      communication: record.communication,
      technicalKnowledge: record.technicalKnowledge,
      confidence: record.confidence,
      problemSolving: record.problemSolving,
      overallScore: record.overallScore,
      strengths: record.strengths,
      improvements: record.improvements,
      nextSteps: record.nextSteps,
      submittedAt: record.submittedAt.toISOString(),
      createdAt: record.createdAt.toISOString(),
    };
  }
}

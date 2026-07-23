import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';

export interface CreateEvaluationDto {
  communication: number;
  technicalKnowledge: number;
  confidence: number;
  problemSolving: number;
  strengths?: string;
  improvements?: string;
  nextSteps?: string;
}

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createEvaluation(
    bookingId: string,
    trainerId: string,
    dto: CreateEvaluationDto,
  ): Promise<any> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trainer: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.trainer.userId !== trainerId) {
      throw new BadRequestException('Only session trainer can evaluate');
    }

    if (booking.status !== 'COMPLETED') {
      throw new BadRequestException('Booking must be completed before evaluation');
    }

    const existing = await this.prisma.evaluation.findUnique({
      where: { bookingId },
    });

    if (existing) {
      throw new BadRequestException('Evaluation already exists');
    }

    if (dto.communication < 1 || dto.communication > 5) {
      throw new BadRequestException('Scores must be 1-5');
    }

    const avg = Math.round(
      (dto.communication + dto.technicalKnowledge + dto.confidence + dto.problemSolving) / 4,
    );

    const evaluation = await this.prisma.evaluation.create({
      data: {
        bookingId,
        trainerId: booking.trainerId,
        communication: dto.communication,
        technicalKnowledge: dto.technicalKnowledge,
        confidence: dto.confidence,
        problemSolving: dto.problemSolving,
        overallScore: avg,
        strengths: dto.strengths,
        improvements: dto.improvements,
        nextSteps: dto.nextSteps,
        submittedAt: new Date(),
      },
    });

    await this.auditService.recordBestEffort({
      action: 'trainer.evaluation_created',
      actorType: AuditActorType.USER,
      actorUserId: trainerId,
      targetType: 'evaluation',
      targetId: evaluation.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { bookingId, overallScore: avg },
    });

    this.logger.log(`Evaluation created for booking ${bookingId}: score ${avg}`);

    return evaluation;
  }

  async getEvaluation(evaluationId: string, userId: string): Promise<any> {
    const evaluation = await this.prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: { booking: true, trainer: true },
    });

    if (!evaluation) {
      throw new NotFoundException('Evaluation not found');
    }

    if (evaluation.trainer.userId !== userId && evaluation.booking.candidateId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    return evaluation;
  }

  async listEvaluations(trainerId: string): Promise<any[]> {
    const profile = await this.prisma.trainerProfile.findUnique({
      where: { userId: trainerId },
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundException('Trainer profile not found');
    }

    return this.prisma.evaluation.findMany({
      where: { trainerId: profile.id },
      include: { booking: { select: { candidateId: true, scheduledAt: true } } },
      orderBy: { submittedAt: 'desc' },
    });
  }
}

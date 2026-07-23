import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import type {
  CreateExpertReviewInput,
  ExpertRatingAggregate,
  ExpertReviewResult,
  PaginatedExpertReviewResult,
} from '@nexthire/types';
import { EXPERT_FEEDBACK_ERROR_CODES } from '@nexthire/constants';

interface ReviewRecord {
  id: string;
  bookingId: string;
  expertUserId: string;
  candidateId: string;
  rating: number;
  comment: string | null;
  isHidden: boolean;
  hiddenReason: string | null;
  submittedAt: Date;
  createdAt: Date;
}

@Injectable()
export class ExpertReviewService {
  private readonly logger = new Logger(ExpertReviewService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createForCandidate(
    candidateId: string,
    bookingId: string,
    input: CreateExpertReviewInput,
  ): Promise<ExpertReviewResult> {
    const booking = await this.prisma.expertBooking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.candidateId !== candidateId) {
      throw new NotFoundException(EXPERT_FEEDBACK_ERROR_CODES.BOOKING_NOT_FOUND);
    }
    if (booking.status !== 'COMPLETED') {
      throw new BadRequestException({
        code: EXPERT_FEEDBACK_ERROR_CODES.BOOKING_NOT_COMPLETED,
        message: 'Booking must be completed before you can review it',
      });
    }

    const existing = await this.prisma.expertReview.findUnique({ where: { bookingId } });
    if (existing) {
      throw new BadRequestException(EXPERT_FEEDBACK_ERROR_CODES.ALREADY_SUBMITTED);
    }

    const review = await this.prisma.expertReview.create({
      data: {
        bookingId,
        expertUserId: booking.expertUserId,
        candidateId,
        rating: input.rating,
        comment: input.comment ?? null,
        submittedAt: new Date(),
      },
    });

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: candidateId,
      action: 'expert.review.created',
      targetType: 'ExpertReview',
      targetId: review.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { bookingId, expertUserId: booking.expertUserId, rating: input.rating },
    });

    this.logger.log(`Review ${review.id} submitted for booking ${bookingId}`);

    return this.mapReview(review);
  }

  async getForCandidate(
    candidateId: string,
    bookingId: string,
  ): Promise<ExpertReviewResult | null> {
    const booking = await this.prisma.expertBooking.findUnique({
      where: { id: bookingId },
      select: { candidateId: true },
    });
    if (!booking || booking.candidateId !== candidateId) {
      throw new NotFoundException(EXPERT_FEEDBACK_ERROR_CODES.BOOKING_NOT_FOUND);
    }
    const review = await this.prisma.expertReview.findUnique({ where: { bookingId } });
    return review ? this.mapReview(review) : null;
  }

  async getForExpert(expertUserId: string, bookingId: string): Promise<ExpertReviewResult | null> {
    const booking = await this.prisma.expertBooking.findUnique({
      where: { id: bookingId },
      select: { expertUserId: true },
    });
    if (!booking || booking.expertUserId !== expertUserId) {
      throw new NotFoundException(EXPERT_FEEDBACK_ERROR_CODES.BOOKING_NOT_FOUND);
    }
    const review = await this.prisma.expertReview.findUnique({ where: { bookingId } });
    return review ? this.mapReview(review) : null;
  }

  async listForExpertOwner(
    expertUserId: string,
    query: { page: number; pageSize: number },
  ): Promise<PaginatedExpertReviewResult> {
    const { page, pageSize } = query;
    const [total, rows, aggregate] = await Promise.all([
      this.prisma.expertReview.count({ where: { expertUserId } }),
      this.prisma.expertReview.findMany({
        where: { expertUserId },
        include: {
          candidate: { select: { email: true, candidateProfile: { select: { fullName: true } } } },
        },
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.getAggregateForExpert(expertUserId),
    ]);

    return {
      data: rows.map((r) => ({
        ...this.mapReview(r),
        candidateDisplayName: r.candidate.candidateProfile?.fullName || r.candidate.email,
      })),
      aggregate,
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    };
  }

  async listPublicForExpert(
    expertUserId: string,
    query: { page: number; pageSize: number },
  ): Promise<PaginatedExpertReviewResult> {
    const { page, pageSize } = query;
    const where = { expertUserId, isHidden: false };
    const [total, rows, aggregate] = await Promise.all([
      this.prisma.expertReview.count({ where }),
      this.prisma.expertReview.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.getAggregateForExpert(expertUserId),
    ]);

    return {
      data: rows.map((r) => this.mapReview(r)),
      aggregate,
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    };
  }

  async getAggregateForExpert(expertUserId: string): Promise<ExpertRatingAggregate> {
    const result = await this.prisma.expertReview.aggregate({
      where: { expertUserId, isHidden: false },
      _avg: { rating: true },
      _count: { rating: true },
    });
    return {
      average: result._avg.rating !== null ? Math.round(result._avg.rating * 10) / 10 : null,
      count: result._count.rating,
    };
  }

  async getAggregatesForExperts(
    expertUserIds: string[],
  ): Promise<Map<string, ExpertRatingAggregate>> {
    if (expertUserIds.length === 0) return new Map();
    const rows = await this.prisma.expertReview.groupBy({
      by: ['expertUserId'],
      where: { expertUserId: { in: expertUserIds }, isHidden: false },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const map = new Map<string, ExpertRatingAggregate>();
    for (const row of rows) {
      map.set(row.expertUserId, {
        average: row._avg.rating !== null ? Math.round(row._avg.rating * 10) / 10 : null,
        count: row._count.rating,
      });
    }
    return map;
  }

  async listForAdmin(query: {
    page: number;
    pageSize: number;
    expertUserId?: string;
    isHidden?: boolean;
  }): Promise<PaginatedExpertReviewResult> {
    const { page, pageSize, expertUserId, isHidden } = query;
    const where: Record<string, unknown> = {};
    if (expertUserId) where.expertUserId = expertUserId;
    if (isHidden !== undefined) where.isHidden = isHidden;

    const [total, rows] = await Promise.all([
      this.prisma.expertReview.count({ where }),
      this.prisma.expertReview.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data: rows.map((r) => this.mapReview(r)),
      aggregate: { average: null, count: total },
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    };
  }

  async hideReview(
    reviewId: string,
    adminUserId: string,
    reason?: string | null,
  ): Promise<ExpertReviewResult> {
    const review = await this.prisma.expertReview.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException(EXPERT_FEEDBACK_ERROR_CODES.NOT_FOUND);
    }
    const updated = await this.prisma.expertReview.update({
      where: { id: reviewId },
      data: { isHidden: true, hiddenAt: new Date(), hiddenReason: reason ?? null },
    });
    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: adminUserId,
      action: 'expert.review.hidden',
      targetType: 'ExpertReview',
      targetId: reviewId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { reason: reason ?? null },
    });
    return this.mapReview(updated);
  }

  async unhideReview(reviewId: string, adminUserId: string): Promise<ExpertReviewResult> {
    const review = await this.prisma.expertReview.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException(EXPERT_FEEDBACK_ERROR_CODES.NOT_FOUND);
    }
    const updated = await this.prisma.expertReview.update({
      where: { id: reviewId },
      data: { isHidden: false, hiddenAt: null, hiddenReason: null },
    });
    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: adminUserId,
      action: 'expert.review.unhidden',
      targetType: 'ExpertReview',
      targetId: reviewId,
      outcome: AuditOutcome.SUCCESS,
    });
    return this.mapReview(updated);
  }

  private mapReview(record: ReviewRecord): ExpertReviewResult {
    return {
      id: record.id,
      bookingId: record.bookingId,
      expertUserId: record.expertUserId,
      candidateId: record.candidateId,
      rating: record.rating,
      comment: record.comment,
      isHidden: record.isHidden,
      hiddenReason: record.hiddenReason,
      submittedAt: record.submittedAt.toISOString(),
      createdAt: record.createdAt.toISOString(),
    };
  }
}

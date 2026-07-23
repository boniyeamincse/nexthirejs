import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DateTime } from 'luxon';
import { PrismaService } from '../../../database/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import type {
  CreateExpertBookingInput,
  ExpertBookingResult,
  ExpertBookingStatus,
  ExpertServiceType,
  SupportedCurrency,
} from '@nexthire/types';
import { EXPERT_BOOKING_ERROR_CODES, EXPERT_BOOKING_HOLD_MINUTES } from '@nexthire/constants';
import { ExpertSlotService } from '../availability/expert-slot.service';
import {
  EXPERT_BOOKING_HOLD_QUEUE,
  EXPIRE_EXPERT_BOOKING_HOLD_JOB,
} from '../../../infrastructure/queue/queue.constants';

interface CounterpartyUser {
  id: string;
  email: string;
  candidateProfile?: { fullName: string } | null;
}

const CANDIDATE_INCLUDE = {
  expertService: true,
  expertUser: {
    select: { id: true, email: true, candidateProfile: { select: { fullName: true } } },
  },
};

const EXPERT_INCLUDE = {
  expertService: true,
  candidate: {
    select: { id: true, email: true, candidateProfile: { select: { fullName: true } } },
  },
};

interface BookingRecordForMapping {
  id: string;
  expertUserId: string;
  expertServiceId: string;
  candidateId: string;
  status: ExpertBookingStatus;
  slotStartUtc: Date;
  slotEndUtc: Date;
  holdExpiresAt: Date | null;
  meetingUrl: string | null;
  notes: string | null;
  cancelledAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  expertService: {
    id: string;
    title: string;
    type: string;
    durationMinutes: number;
    priceAmount: { toString(): string };
    priceCurrency: string;
  };
  expertUser?: CounterpartyUser;
  candidate?: CounterpartyUser;
}

const ACTIVE_STATUSES = ['HELD', 'CONFIRMED'] as const;

@Injectable()
export class ExpertBookingService {
  private readonly logger = new Logger(ExpertBookingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly slotService: ExpertSlotService,
    @InjectQueue(EXPERT_BOOKING_HOLD_QUEUE) private readonly holdQueue: Queue,
  ) {}

  async createForCandidate(
    candidateId: string,
    input: CreateExpertBookingInput,
  ): Promise<ExpertBookingResult> {
    const service = await this.prisma.expertService.findUnique({
      where: { id: input.expertServiceId },
    });

    if (!service || service.status !== 'ACTIVE') {
      throw new BadRequestException({
        code: EXPERT_BOOKING_ERROR_CODES.SERVICE_NOT_BOOKABLE,
        message: 'This service is not available for booking',
      });
    }

    if (service.userId === candidateId) {
      throw new BadRequestException({
        code: EXPERT_BOOKING_ERROR_CODES.CANNOT_BOOK_SELF,
        message: 'You cannot book your own service',
      });
    }

    const expertProfile = await this.prisma.expertProfile.findUnique({
      where: { userId: service.userId },
      select: { isPublic: true },
    });
    if (!expertProfile || !expertProfile.isPublic) {
      throw new BadRequestException({
        code: EXPERT_BOOKING_ERROR_CODES.SERVICE_NOT_BOOKABLE,
        message: 'This service is not available for booking',
      });
    }

    const slotStart = DateTime.fromISO(input.slotStartUtc, { zone: 'utc' });
    if (!slotStart.isValid) {
      throw new BadRequestException({
        code: EXPERT_BOOKING_ERROR_CODES.VALIDATION_FAILED,
        message: 'Invalid slotStartUtc',
      });
    }
    const slotEnd = slotStart.plus({ minutes: service.durationMinutes });

    // Widen by a day on each side so a slot generated on an adjacent local
    // calendar date (relative to the UTC date of slotStartUtc) is still
    // covered by the preview window used to validate it.
    const previewFrom = slotStart.minus({ days: 1 }).toISODate();
    const previewTo = slotStart.plus({ days: 1 }).toISODate();
    const preview = await this.slotService.previewSlots(service.userId, {
      from: previewFrom,
      to: previewTo,
      durationMinutes: service.durationMinutes,
    });
    const matchesOfferedSlot = preview.slots.some((s) => s.startUtc === slotStart.toUTC().toISO());
    if (!matchesOfferedSlot) {
      throw new BadRequestException({
        code: EXPERT_BOOKING_ERROR_CODES.SLOT_NOT_AVAILABLE,
        message: 'This slot is no longer available',
      });
    }

    const holdExpiresAt = DateTime.utc().plus({ minutes: EXPERT_BOOKING_HOLD_MINUTES });

    let bookingId: string;
    try {
      const booking = await this.prisma.expertBooking.create({
        data: {
          expertUserId: service.userId,
          expertServiceId: service.id,
          candidateId,
          status: 'HELD',
          slotStartUtc: slotStart.toJSDate(),
          slotEndUtc: slotEnd.toJSDate(),
          holdExpiresAt: holdExpiresAt.toJSDate(),
        },
      });
      bookingId = booking.id;
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictException(EXPERT_BOOKING_ERROR_CODES.SLOT_CONFLICT);
      }
      throw error;
    }

    await this.holdQueue.add(
      EXPIRE_EXPERT_BOOKING_HOLD_JOB,
      { bookingId },
      { delay: EXPERT_BOOKING_HOLD_MINUTES * 60_000, jobId: bookingId },
    );

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: candidateId,
      action: 'expert.booking.created',
      targetType: 'ExpertBooking',
      targetId: bookingId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { expertServiceId: service.id, expertUserId: service.userId },
    });

    this.logger.log(`Booking ${bookingId} held by candidate ${candidateId}`);

    return this.getForCandidate(candidateId, bookingId);
  }

  async confirmForCandidate(candidateId: string, bookingId: string): Promise<ExpertBookingResult> {
    const booking = await this.prisma.expertBooking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.candidateId !== candidateId) {
      throw new NotFoundException(EXPERT_BOOKING_ERROR_CODES.NOT_FOUND);
    }
    if (booking.status !== 'HELD') {
      throw new BadRequestException({
        code: EXPERT_BOOKING_ERROR_CODES.INVALID_TRANSITION,
        message: `Cannot confirm a booking with status ${booking.status}`,
      });
    }
    if (!booking.holdExpiresAt || booking.holdExpiresAt.getTime() <= Date.now()) {
      throw new BadRequestException({
        code: EXPERT_BOOKING_ERROR_CODES.HOLD_EXPIRED,
        message: 'The reservation hold on this slot has expired',
      });
    }

    await this.prisma.expertBooking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED', holdExpiresAt: null },
    });

    await this.removeHoldJob(bookingId);

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: candidateId,
      action: 'expert.booking.confirmed',
      targetType: 'ExpertBooking',
      targetId: bookingId,
      outcome: AuditOutcome.SUCCESS,
    });

    return this.getForCandidate(candidateId, bookingId);
  }

  async cancelForCandidate(candidateId: string, bookingId: string): Promise<ExpertBookingResult> {
    const booking = await this.prisma.expertBooking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.candidateId !== candidateId) {
      throw new NotFoundException(EXPERT_BOOKING_ERROR_CODES.NOT_FOUND);
    }
    await this.cancel(booking.id, booking.status, candidateId, 'candidate');
    return this.getForCandidate(candidateId, bookingId);
  }

  async listForCandidate(candidateId: string, status?: string): Promise<ExpertBookingResult[]> {
    const where: Record<string, unknown> = { candidateId };
    if (status) where.status = status;
    const rows = await this.prisma.expertBooking.findMany({
      where,
      include: CANDIDATE_INCLUDE,
      orderBy: { slotStartUtc: 'asc' },
    });
    return rows.map((r) => this.mapBooking(r, 'candidate'));
  }

  async getForCandidate(candidateId: string, bookingId: string): Promise<ExpertBookingResult> {
    const row = await this.prisma.expertBooking.findUnique({
      where: { id: bookingId },
      include: CANDIDATE_INCLUDE,
    });
    if (!row || row.candidateId !== candidateId) {
      throw new NotFoundException(EXPERT_BOOKING_ERROR_CODES.NOT_FOUND);
    }
    return this.mapBooking(row, 'candidate');
  }

  async listForExpert(expertUserId: string, status?: string): Promise<ExpertBookingResult[]> {
    const where: Record<string, unknown> = { expertUserId };
    if (status) where.status = status;
    const rows = await this.prisma.expertBooking.findMany({
      where,
      include: EXPERT_INCLUDE,
      orderBy: { slotStartUtc: 'asc' },
    });
    return rows.map((r) => this.mapBooking(r, 'expert'));
  }

  async getForExpert(expertUserId: string, bookingId: string): Promise<ExpertBookingResult> {
    const row = await this.prisma.expertBooking.findUnique({
      where: { id: bookingId },
      include: EXPERT_INCLUDE,
    });
    if (!row || row.expertUserId !== expertUserId) {
      throw new NotFoundException(EXPERT_BOOKING_ERROR_CODES.NOT_FOUND);
    }
    return this.mapBooking(row, 'expert');
  }

  async updateForExpert(
    expertUserId: string,
    bookingId: string,
    input: { meetingUrl?: string | null; notes?: string | null; action?: 'complete' | 'cancel' },
  ): Promise<ExpertBookingResult> {
    const booking = await this.prisma.expertBooking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.expertUserId !== expertUserId) {
      throw new NotFoundException(EXPERT_BOOKING_ERROR_CODES.NOT_FOUND);
    }

    if (input.action === 'cancel') {
      await this.cancel(booking.id, booking.status, expertUserId, 'expert');
      return this.getForExpert(expertUserId, bookingId);
    }

    if (input.action === 'complete') {
      if (booking.status !== 'CONFIRMED') {
        throw new BadRequestException({
          code: EXPERT_BOOKING_ERROR_CODES.INVALID_TRANSITION,
          message: `Cannot complete a booking with status ${booking.status}`,
        });
      }
      if (booking.slotEndUtc.getTime() > Date.now()) {
        throw new BadRequestException({
          code: EXPERT_BOOKING_ERROR_CODES.INVALID_TRANSITION,
          message: 'Cannot complete a booking before its scheduled end time',
        });
      }
      await this.prisma.expertBooking.update({
        where: { id: bookingId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      await this.auditService.recordBestEffort({
        actorType: AuditActorType.USER,
        actorUserId: expertUserId,
        action: 'expert.booking.completed',
        targetType: 'ExpertBooking',
        targetId: bookingId,
        outcome: AuditOutcome.SUCCESS,
      });
      return this.getForExpert(expertUserId, bookingId);
    }

    const updateData: Record<string, unknown> = {};
    if (input.meetingUrl !== undefined) updateData.meetingUrl = input.meetingUrl;
    if (input.notes !== undefined) updateData.notes = input.notes;

    if (Object.keys(updateData).length > 0) {
      await this.prisma.expertBooking.update({ where: { id: bookingId }, data: updateData });
      await this.auditService.recordBestEffort({
        actorType: AuditActorType.USER,
        actorUserId: expertUserId,
        action: 'expert.booking.updated',
        targetType: 'ExpertBooking',
        targetId: bookingId,
        outcome: AuditOutcome.SUCCESS,
      });
    }

    return this.getForExpert(expertUserId, bookingId);
  }

  /** Invoked by the delayed BullMQ job — no-ops if the hold was already confirmed/cancelled. */
  async expireHoldIfDue(bookingId: string): Promise<void> {
    const booking = await this.prisma.expertBooking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.status !== 'HELD') {
      return;
    }
    if (booking.holdExpiresAt && booking.holdExpiresAt.getTime() > Date.now()) {
      return;
    }
    await this.prisma.expertBooking.update({
      where: { id: bookingId },
      data: { status: 'EXPIRED' },
    });
    await this.auditService.recordBestEffort({
      actorType: AuditActorType.SYSTEM,
      action: 'expert.booking.hold_expired',
      targetType: 'ExpertBooking',
      targetId: bookingId,
      outcome: AuditOutcome.SUCCESS,
    });
    this.logger.log(`Booking ${bookingId} hold expired`);
  }

  private async cancel(
    bookingId: string,
    currentStatus: string,
    actorUserId: string,
    actorRole: 'candidate' | 'expert',
  ): Promise<void> {
    if (!(ACTIVE_STATUSES as readonly string[]).includes(currentStatus)) {
      throw new BadRequestException({
        code: EXPERT_BOOKING_ERROR_CODES.INVALID_TRANSITION,
        message: `Cannot cancel a booking with status ${currentStatus}`,
      });
    }
    await this.prisma.expertBooking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
    await this.removeHoldJob(bookingId);
    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId,
      action: 'expert.booking.cancelled',
      targetType: 'ExpertBooking',
      targetId: bookingId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { cancelledBy: actorRole },
    });
  }

  private async removeHoldJob(bookingId: string): Promise<void> {
    try {
      const job = await this.holdQueue.getJob(bookingId);
      if (job) {
        await job.remove();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to remove hold-expiry job for booking ${bookingId}: ${message}`);
    }
  }

  private displayName(user: CounterpartyUser): string {
    return user.candidateProfile?.fullName || user.email;
  }

  private mapBooking(
    record: BookingRecordForMapping,
    perspective: 'candidate' | 'expert',
  ): ExpertBookingResult {
    const counterpartyUser = (perspective === 'candidate' ? record.expertUser : record.candidate)!;

    return {
      id: record.id,
      expertUserId: record.expertUserId,
      expertServiceId: record.expertServiceId,
      candidateId: record.candidateId,
      status: record.status,
      slotStartUtc: record.slotStartUtc.toISOString(),
      slotEndUtc: record.slotEndUtc.toISOString(),
      holdExpiresAt: record.holdExpiresAt ? record.holdExpiresAt.toISOString() : null,
      meetingUrl: record.meetingUrl,
      notes: record.notes,
      cancelledAt: record.cancelledAt ? record.cancelledAt.toISOString() : null,
      completedAt: record.completedAt ? record.completedAt.toISOString() : null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      service: {
        id: record.expertService.id,
        title: record.expertService.title,
        type: record.expertService.type as ExpertServiceType,
        durationMinutes: record.expertService.durationMinutes,
        price: {
          amount: record.expertService.priceAmount.toString(),
          currency: record.expertService.priceCurrency as SupportedCurrency,
        },
      },
      counterparty: {
        id: counterpartyUser.id,
        displayName: this.displayName(counterpartyUser),
      },
    };
  }
}

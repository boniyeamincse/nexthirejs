import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';

export interface CreateBookingDto {
  trainerId: string;
  packageId: string;
  scheduledAt: string;
  notes?: string;
}

export interface UpdateBookingDto {
  status?: 'PENDING_PAYMENT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  scheduledAt?: string;
  meetingUrl?: string;
  notes?: string;
}

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createBooking(candidateId: string, dto: CreateBookingDto): Promise<any> {
    const trainer = await this.prisma.trainerProfile.findUnique({
      where: { userId: dto.trainerId },
      select: { id: true },
    });

    if (!trainer) {
      throw new NotFoundException('Trainer not found');
    }

    const pkg = await this.prisma.trainerPackage.findUnique({
      where: { id: dto.packageId },
      select: { duration: true, trainerId: true },
    });

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    if (pkg.trainerId !== trainer.id) {
      throw new BadRequestException('Package does not belong to trainer');
    }

    const scheduled = new Date(dto.scheduledAt);
    if (scheduled <= new Date()) {
      throw new BadRequestException('Scheduled time must be in future');
    }

    const endTime = new Date(scheduled.getTime() + pkg.duration * 60000);

    const booking = await this.prisma.booking.create({
      data: {
        trainerId: trainer.id,
        packageId: dto.packageId,
        candidateId,
        scheduledAt: scheduled,
        endTime,
        notes: dto.notes,
        status: 'PENDING_PAYMENT',
      },
    });

    await this.auditService.recordBestEffort({
      action: 'trainer.booking_created',
      actorType: AuditActorType.USER,
      actorUserId: candidateId,
      targetType: 'booking',
      targetId: booking.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { trainerId: dto.trainerId, packageId: dto.packageId },
    });

    this.logger.log(`Booking created: ${booking.id} by candidate ${candidateId}`);

    return booking;
  }

  async getBooking(bookingId: string, userId: string): Promise<any> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        package: {
          include: { service: true },
        },
        trainer: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.candidateId !== userId && booking.trainer.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    return booking;
  }

  async listBookings(userId: string, role: 'candidate' | 'trainer'): Promise<any[]> {
    if (role === 'candidate') {
      return this.prisma.booking.findMany({
        where: { candidateId: userId },
        include: {
          package: { include: { service: true } },
          trainer: true,
        },
        orderBy: { scheduledAt: 'asc' },
      });
    } else {
      const profile = await this.prisma.trainerProfile.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!profile) {
        throw new NotFoundException('Trainer profile not found');
      }

      return this.prisma.booking.findMany({
        where: { trainerId: profile.id },
        include: {
          package: { include: { service: true } },
          candidate: { select: { id: true, email: true } },
        },
        orderBy: { scheduledAt: 'asc' },
      });
    }
  }

  async updateBooking(bookingId: string, userId: string, dto: UpdateBookingDto): Promise<any> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trainer: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.trainer.userId !== userId) {
      throw new BadRequestException('Only trainer can update booking');
    }

    const updateData: any = {};
    if (dto.status) updateData.status = dto.status;
    if (dto.scheduledAt) updateData.scheduledAt = new Date(dto.scheduledAt);
    if (dto.meetingUrl) updateData.meetingUrl = dto.meetingUrl;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: { package: true },
    });

    await this.auditService.recordBestEffort({
      action: 'trainer.booking_updated',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'booking',
      targetId: bookingId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { previousStatus: booking.status, newStatus: updated.status },
    });

    this.logger.log(`Booking ${bookingId} updated by trainer ${userId}`);

    return updated;
  }

  async cancelBooking(bookingId: string, userId: string): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trainer: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.trainer.userId !== userId && booking.candidateId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    });

    await this.auditService.recordBestEffort({
      action: 'trainer.booking_cancelled',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'booking',
      targetId: bookingId,
      outcome: AuditOutcome.SUCCESS,
    });

    this.logger.log(`Booking ${bookingId} cancelled by ${userId}`);
  }
}

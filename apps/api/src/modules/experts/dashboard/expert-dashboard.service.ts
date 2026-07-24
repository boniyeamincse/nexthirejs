import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ExpertReviewService } from '../feedback/expert-review.service';
import { ExpertWalletService } from '../wallet/expert-wallet.service';
import type { ExpertDashboardBookingSummary, ExpertDashboardResult } from '@nexthire/types';

interface UpcomingBookingRow {
  id: string;
  slotStartUtc: Date;
  expertService: { title: string; durationMinutes: number };
  candidate: { email: string; candidateProfile: { fullName: string } | null };
}

@Injectable()
export class ExpertDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reviewService: ExpertReviewService,
    private readonly walletService: ExpertWalletService,
  ) {}

  async getDashboard(userId: string): Promise<ExpertDashboardResult> {
    const now = new Date();

    const [
      upcomingBookingsCount,
      completedSessionsCount,
      activeServicesCount,
      upcomingBookingRows,
      availabilityProfile,
      rating,
      wallet,
      recentReviewsPage,
    ] = await Promise.all([
      this.prisma.expertBooking.count({
        where: { expertUserId: userId, status: 'CONFIRMED', slotStartUtc: { gte: now } },
      }),
      this.prisma.expertBooking.count({
        where: { expertUserId: userId, status: 'COMPLETED' },
      }),
      this.prisma.expertService.count({ where: { userId, status: 'ACTIVE' } }),
      this.prisma.expertBooking.findMany({
        where: { expertUserId: userId, status: 'CONFIRMED', slotStartUtc: { gte: now } },
        include: {
          expertService: { select: { title: true, durationMinutes: true } },
          candidate: { select: { email: true, candidateProfile: { select: { fullName: true } } } },
        },
        orderBy: { slotStartUtc: 'asc' },
        take: 5,
      }),
      this.prisma.expertAvailabilityProfile.findUnique({ where: { userId }, select: { id: true } }),
      this.reviewService.getAggregateForExpert(userId),
      this.walletService.getWallet(userId),
      this.reviewService.listForExpertOwner(userId, { page: 1, pageSize: 3 }),
    ]);

    return {
      stats: { upcomingBookingsCount, completedSessionsCount, activeServicesCount, rating },
      upcomingBookings: upcomingBookingRows.map((b) => this.mapUpcomingBooking(b)),
      wallet,
      recentReviews: recentReviewsPage.data,
      hasAvailabilityConfigured: !!availabilityProfile,
    };
  }

  private mapUpcomingBooking(record: UpcomingBookingRow): ExpertDashboardBookingSummary {
    return {
      id: record.id,
      serviceTitle: record.expertService.title,
      candidateDisplayName: record.candidate.candidateProfile?.fullName || record.candidate.email,
      slotStartUtc: record.slotStartUtc.toISOString(),
      durationMinutes: record.expertService.durationMinutes,
    };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AdminExpertsService {
  constructor(private readonly prisma: PrismaService) {}

  async getExperts(
    page: number,
    limit: number,
    filters: { search?: string; status?: string; verified?: string; country?: string },
  ) {
    const where: any = { expertProfile: { isNot: null } };
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { expertProfile: { professionalTitle: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }
    if (filters.status) where.status = filters.status.toUpperCase();

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          expertProfile: true,
          _count: { select: { expertApplications: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      experts: users.map((u) => ({
        id: u.id,
        email: u.email,
        status: u.status,
        professionalTitle: u.expertProfile?.professionalTitle || null,
        yearsOfExperience: u.expertProfile?.yearsOfExperience || 0,
        countryId: u.expertProfile?.countryId,
        isPublic: u.expertProfile?.isPublic || false,
        applicationCount: u._count.expertApplications,
        createdAt: u.createdAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getExpert(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        expertProfile: true,
        roles: { include: { role: true } },
        expertApplications: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!user || !user.expertProfile) throw new NotFoundException('Expert not found');
    return { ...user, roleCodes: user.roles.map((r) => r.role.code) };
  }

  async getExpertProfile(id: string) {
    const profile = await this.prisma.expertProfile.findUnique({
      where: { userId: id },
      include: { user: { select: { email: true, status: true } } },
    });
    if (!profile) throw new NotFoundException('Expert profile not found');
    return { profile };
  }

  async getExpertServices(id: string) {
    const services = await this.prisma.expertService.findMany({ where: { userId: id } });
    return { services };
  }

  async getExpertBookings(id: string) {
    const profile = await this.prisma.expertProfile.findUnique({ where: { userId: id } });
    if (!profile) throw new NotFoundException('Expert not found');
    const bookings = await this.prisma.booking.findMany({
      where: { trainerId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
    return { bookings };
  }

  async getExpertEarnings(id: string) {
    return { earnings: { total: 0, pending: 0, paid: 0 } };
  }

  async getExpertPayouts(id: string) {
    return { payouts: [] };
  }

  async getExpertReviews(id: string) {
    return { reviews: [] };
  }

  async getExpertComplaintsById(id: string) {
    return { complaints: [] };
  }

  async updateExpertStatus(id: string, status: string, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Expert not found');
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        status: status.toUpperCase() as any,
        deactivatedAt: status === 'suspended' ? new Date() : null,
        deactivationReason: reason || null,
      },
    });
    return { id: updated.id, status: updated.status };
  }

  async deleteExpert(id: string) {
    await this.prisma.user.update({ where: { id }, data: { status: 'DELETED' } });
    return { message: 'Expert deleted' };
  }

  async bulkExperts(userIds: string[], action: string) {
    const results = [];
    for (const userId of userIds) {
      try {
        if (action === 'delete') results.push(await this.deleteExpert(userId));
        else if (action === 'suspend') results.push(await this.updateExpertStatus(userId, 'suspended', 'Bulk suspension'));
        else results.push({ id: userId, error: `Unknown action: ${action}` });
      } catch (e: any) {
        results.push({ id: userId, error: e.message });
      }
    }
    return { results };
  }

  async getPendingVerifications(page: number, limit: number) {
    const where = { status: 'SUBMITTED' as const };
    const [apps, total] = await Promise.all([
      this.prisma.expertApplication.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: { user: { select: { email: true } }, expertProfile: { select: { professionalTitle: true } } },
      }),
      this.prisma.expertApplication.count({ where }),
    ]);
    return { verifications: apps, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getVerificationDetail(id: string) {
    const app = await this.prisma.expertApplication.findUnique({
      where: { id },
      include: { user: true, expertProfile: true, documents: true },
    });
    if (!app) throw new NotFoundException('Verification not found');
    return { verification: app };
  }

  async getVerificationDocuments(id: string) {
    const docs = await this.prisma.expertVerificationDocument.findMany({ where: { applicationId: id } });
    return { documents: docs };
  }

  async approveVerification(id: string, note?: string) {
    const app = await this.prisma.expertApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Verification not found');
    await this.prisma.expertApplication.update({
      where: { id },
      data: { status: 'APPROVED', reviewedAt: new Date(), reviewerNote: note || null, approvedAt: new Date() },
    });
    return { message: 'Expert verification approved' };
  }

  async rejectVerification(id: string, reason?: string) {
    const app = await this.prisma.expertApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Verification not found');
    await this.prisma.expertApplication.update({
      where: { id },
      data: { status: 'REJECTED', reviewedAt: new Date(), reviewerNote: reason || null, rejectedAt: new Date() },
    });
    return { message: 'Expert verification rejected' };
  }

  async requestChanges(id: string, feedback?: string) {
    const app = await this.prisma.expertApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Verification not found');
    await this.prisma.expertApplication.update({
      where: { id },
      data: { status: 'CHANGES_REQUESTED', reviewerNote: feedback || null },
    });
    return { message: 'Changes requested' };
  }

  async getVerificationHistory(page: number, limit: number) {
    const apps = await this.prisma.expertApplication.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });
    return { history: apps, pagination: { page, limit } };
  }

  async requestReverification(id: string) {
    return { message: 'Re-verification requested' };
  }

  async getTopExperts(limit: number) {
    return { experts: [] };
  }

  async getBookingPerformance() {
    return { performance: [] };
  }

  async getRatingTrends() {
    return { trends: [] };
  }

  async getEarningsLeaderboard(limit: number) {
    return { leaderboard: [] };
  }

  async getServicePerformance() {
    return { services: [] };
  }

  async getNoShowRates() {
    return { rates: [] };
  }

  async getCompletionRates() {
    return { rates: [] };
  }

  async getComplaints(page: number, limit: number) {
    return { complaints: [], pagination: { page, limit } };
  }

  async getComplaintDetail(id: string) {
    return { complaint: {} };
  }

  async resolveComplaint(id: string, resolution?: string) {
    return { message: 'Complaint resolved' };
  }

  async warnExpert(id: string) {
    return { message: 'Expert warned' };
  }

  async suspendExpert(id: string) {
    return this.updateExpertStatus(id, 'suspended', 'Complaint suspension');
  }

  async addComplaintNote(id: string, note: string) {
    return { message: 'Note added' };
  }

  async getRegistrationTrends() {
    const trends = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setHours(23, 59, 59, 999);
      const count = await this.prisma.user.count({
        where: { createdAt: { gte: start, lte: end }, expertProfile: { isNot: null } },
      });
      trends.push({ date: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), registrations: count });
    }
    return { trends };
  }

  async getVerificationSuccessRate() {
    return { rate: 0 };
  }

  async getBookingAnalytics() {
    return { analytics: [] };
  }

  async getEarningsAnalytics() {
    return { analytics: [] };
  }

  async getServicePopularity() {
    return { services: [] };
  }

  async getCountryDistribution() {
    return { distribution: [] };
  }

  async exportReports(format: string) {
    return { data: [], format };
  }
}

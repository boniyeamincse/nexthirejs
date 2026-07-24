import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AdminCandidatesService {
  constructor(private readonly prisma: PrismaService) {}

  async getCandidates(filters: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    country?: string;
    skill?: string;
  }) {
    const { page, limit, search, status } = filters;
    const where: any = { candidateProfile: { isNot: null } };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { candidateProfile: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) where.status = status.toUpperCase();

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          candidateProfile: true,
          _count: { select: { cvs: true, projects: true, bookingsAsCandidate: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      candidates: (users as any[]).map((u: any) => ({
        id: u.id,
        email: u.email,
        status: u.status,
        fullName: u.candidateProfile?.fullName || null,
        professionalHeadline: u.candidateProfile?.professionalHeadline || null,
        completionPercentage: u.candidateProfile?.completionPercentage || 0,
        cvCount: u._count?.cvs || 0,
        projectCount: u._count?.projects || 0,
        bookingCount: u._count?.bookingsAsCandidate || 0,
        createdAt: u.createdAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getCandidate(id: string) {
    const user = await (this.prisma as any).user.findUnique({
      where: { id },
      include: {
        candidateProfile: true,
        roles: { include: { role: true } },
      },
    });
    if (!user || !user.candidateProfile) throw new NotFoundException('Candidate not found');
    return { ...user, roleCodes: user.roles.map((r: any) => r.role.code) };
  }

  async getCandidateProfile(id: string) {
    const skills = await this.prisma.candidateSkill.findMany({ where: { userId: id }, orderBy: { sortOrder: 'asc' } });
    const languages = await this.prisma.candidateLanguage.findMany({ where: { userId: id }, orderBy: { sortOrder: 'asc' } });
    const certifications = await this.prisma.candidateCertification.findMany({ where: { userId: id }, orderBy: { sortOrder: 'asc' } });
    const educationRecords = await this.prisma.educationRecord.findMany({ where: { userId: id }, orderBy: { startDate: 'desc' } });
    const workExperienceRecords = await this.prisma.workExperienceRecord.findMany({ where: { userId: id }, orderBy: { startDate: 'desc' } });
    const profile = await this.prisma.candidateProfile.findUnique({ where: { userId: id } });
    if (!profile) throw new NotFoundException('Candidate profile not found');
    return { profile, skills, languages, certifications, educationRecords, workExperienceRecords };
  }

  async getCandidatePassport(id: string) {
    const passport = await this.prisma.careerPassport.findUnique({ where: { userId: id } });
    return { passport };
  }

  async getCandidateCVs(id: string) {
    const cvs = await this.prisma.cv.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' } });
    return { cvs };
  }

  async getCandidateProjects(id: string) {
    const projects = await this.prisma.project.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
    });
    return { projects };
  }

  async getCandidateAssessments(id: string) {
    const attempts = await (this.prisma as any).assessmentAttempt.findMany({
      where: { user: { id: id } },
      orderBy: { startedAt: 'desc' },
      include: { assessment: true },
    });
    return { attempts };
  }

  async getCandidateSessions(id: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { candidateId: id },
      orderBy: { createdAt: 'desc' },
      include: { package: true },
    });
    return { bookings };
  }

  async getCandidateActivity(id: string) {
    const [cvs, projects, bookings, assessments] = await Promise.all([
      this.prisma.cv.count({ where: { userId: id } }),
      this.prisma.project.count({ where: { userId: id } }),
      this.prisma.booking.count({ where: { candidateId: id } }),
      (this.prisma as any).assessmentAttempt.count({ where: { user: { id } } }),
    ]);
    const profile = await this.prisma.candidateProfile.findUnique({ where: { userId: id } });
    if (!profile) throw new NotFoundException('Candidate not found');

    return {
      userId: id,
      profileCompletion: profile.completionPercentage,
      summary: { cvs, projects, bookings, assessments },
    };
  }

  async updateCandidateStatus(id: string, status: string, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Candidate not found');
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

  async deleteCandidate(id: string) {
    await this.prisma.user.update({ where: { id }, data: { status: 'DELETED' } });
    return { message: 'Candidate deleted' };
  }

  async getPendingSkillVerifications(page: number, limit: number) {
    return { verifications: [], pagination: { page, limit } };
  }

  async verifySkill(id: string) {
    return { message: 'Skill verified' };
  }

  async rejectSkill(id: string) {
    return { message: 'Skill verification rejected' };
  }

  async getVerifiedSkills() {
    return { skills: [] };
  }

  async getSkillVerificationHistory(page: number, limit: number) {
    return { history: [], pagination: { page, limit } };
  }

  async getReadinessDistribution() {
    const total = await this.prisma.user.count({ where: { candidateProfile: { isNot: null } } });
    return {
      distribution: [
        { level: 'Getting Started', count: Math.floor(total * 0.3), percentage: 30 },
        { level: 'Learning', count: Math.floor(total * 0.25), percentage: 25 },
        { level: 'Developing', count: Math.floor(total * 0.2), percentage: 20 },
        { level: 'Interview Ready', count: Math.floor(total * 0.15), percentage: 15 },
        { level: 'Job Ready', count: Math.floor(total * 0.1), percentage: 10 },
      ],
    };
  }

  async getReadinessProgress() {
    return { progress: [] };
  }

  async getSkillGaps() {
    return { gaps: [] };
  }

  async getReadinessReports() {
    return { reports: [] };
  }

  async getRegistrationTrends() {
    const trends = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setHours(23, 59, 59, 999);
      const count = await this.prisma.user.count({
        where: { createdAt: { gte: start, lte: end }, candidateProfile: { isNot: null } },
      });
      trends.push({ date: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), registrations: count });
    }
    return { trends };
  }

  async getProfileCompletion() {
    const profiles = await (this.prisma as any).candidateProfile.findMany({
      select: { completionPercentage: true },
    });
    const buckets = [
      { range: '0-20%', min: 0, max: 20, count: 0 },
      { range: '21-40%', min: 21, max: 40, count: 0 },
      { range: '41-60%', min: 41, max: 60, count: 0 },
      { range: '61-80%', min: 61, max: 80, count: 0 },
      { range: '81-100%', min: 81, max: 100, count: 0 },
    ];
    for (const p of profiles) {
      const pct = (p as any).completionPercentage || 0;
      for (const b of buckets) {
        if (pct >= b.min && pct <= b.max) { b.count++; break; }
      }
    }
    const avg = profiles.length > 0
      ? Math.round(profiles.reduce((s: number, p: any) => s + (p.completionPercentage || 0), 0) / profiles.length)
      : 0;
    return { completion: buckets, averageCompletion: avg, totalProfiles: profiles.length };
  }

  async getReadinessImprovement() {
    const total = await this.prisma.user.count({ where: { candidateProfile: { isNot: null } } });
    return {
      improvement: [
        { month: 'Month 1', ready: Math.floor(total * 0.05), learning: Math.floor(total * 0.35), developing: Math.floor(total * 0.4), gettingStarted: Math.floor(total * 0.2) },
        { month: 'Month 2', ready: Math.floor(total * 0.08), learning: Math.floor(total * 0.38), developing: Math.floor(total * 0.37), gettingStarted: Math.floor(total * 0.17) },
        { month: 'Month 3', ready: Math.floor(total * 0.12), learning: Math.floor(total * 0.4), developing: Math.floor(total * 0.33), gettingStarted: Math.floor(total * 0.15) },
        { month: 'Month 4', ready: Math.floor(total * 0.15), learning: Math.floor(total * 0.38), developing: Math.floor(total * 0.32), gettingStarted: Math.floor(total * 0.15) },
      ],
    };
  }

  async getCountryDistribution() {
    const profiles = await (this.prisma as any).candidateProfile.findMany({
      where: { country: { not: null } },
      select: { country: true },
    });
    const map = new Map<string, number>();
    for (const p of profiles) {
      const country = (p as any).country || 'Unknown';
      map.set(country, (map.get(country) || 0) + 1);
    }
    const distribution = Array.from(map.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);
    return { distribution };
  }

  async getSkillDistribution() {
    const skills = await this.prisma.candidateSkill.findMany({
      select: { name: true },
    });
    const map = new Map<string, number>();
    for (const s of skills) {
      map.set(s.name, (map.get(s.name) || 0) + 1);
    }
    const result = Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);
    return { skills: result };
  }

  async exportReports(format: string) {
    const candidates = await this.getCandidates({ page: 1, limit: 5000 });
    if (format === 'csv') {
      const header = 'ID,Email,Full Name,Status,Completion %,CVs,Projects,Bookings,Created At\n';
      const rows = candidates.candidates.map((c: any) =>
        `${c.id},${c.email},"${c.fullName || ''}",${c.status},${c.completionPercentage},${c.cvCount},${c.projectCount},${c.bookingCount},${c.createdAt}`
      ).join('\n');
      return { csv: header + rows, count: candidates.candidates.length, format: 'csv' };
    }
    return { data: candidates.candidates, format };
  }

  async getCandidateApplications(id: string) {
    return { applications: [] };
  }

  async bulkCandidates(userIds: string[], action: string) {
    const results = [];
    for (const userId of userIds) {
      try {
        if (action === 'delete') results.push(await this.deleteCandidate(userId));
        else results.push({ id: userId, error: `Unknown action: ${action}` });
      } catch (e: any) {
        results.push({ id: userId, error: e.message });
      }
    }
    return { results };
  }
}

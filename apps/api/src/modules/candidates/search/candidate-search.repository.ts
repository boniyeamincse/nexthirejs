import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

export interface CandidateSearchFilters {
  page: number;
  pageSize: number;
  search?: string;
  countryId?: string;
  skill?: string;
}

const DISCOVERABLE_WHERE = {
  profilePrivacy: {
    overallDiscoverability: 'PLATFORM_DISCOVERABLE' as const,
    basicProfile: { not: 'HIDDEN' as const },
  },
  candidateProfile: { isNot: null },
  status: { notIn: ['SUSPENDED' as const, 'DELETED' as const] },
};

@Injectable()
export class CandidateSearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async search(filters: CandidateSearchFilters) {
    const { page, pageSize, search, countryId, skill } = filters;

    const where: Record<string, unknown> = { ...DISCOVERABLE_WHERE };

    if (search) {
      where.candidateProfile = {
        isNot: null,
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { professionalHeadline: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    if (countryId) {
      where.candidatePreference = { countryId };
    }

    if (skill) {
      where.skills = { some: { normalizedName: { contains: skill, mode: 'insensitive' } } };
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { candidateProfile: { updatedAt: 'desc' } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          candidateProfile: true,
          candidatePreference: { include: { country: true } },
          profilePrivacy: true,
          skills: { orderBy: { sortOrder: 'asc' }, take: 8 },
        },
      }),
    ]);

    return { total, rows };
  }

  findDiscoverableById(candidateUserId: string) {
    return this.prisma.user.findFirst({
      where: { id: candidateUserId, ...DISCOVERABLE_WHERE },
      select: { id: true },
    });
  }
}

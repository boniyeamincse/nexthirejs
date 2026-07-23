import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { PublicExpertListQuery } from '@nexthire/types';

const EXPERT_ROLE_FILTER = { roles: { some: { role: { code: 'expert' } } } };

@Injectable()
export class ExpertPublicDirectoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(
    query: Required<Pick<PublicExpertListQuery, 'page' | 'pageSize'>> & PublicExpertListQuery,
  ) {
    const { page, pageSize } = query;

    const profileFilter: Record<string, unknown> = { isPublic: true, publicSlug: { not: null } };
    if (query.country) profileFilter.countryId = query.country;
    if (query.search)
      profileFilter.professionalTitle = { contains: query.search, mode: 'insensitive' };

    const where: Record<string, unknown> = {
      ...EXPERT_ROLE_FILTER,
      expertProfile: profileFilter,
    };

    if (query.expertiseAreaId) {
      where.expertExpertise = { some: { expertiseAreaId: query.expertiseAreaId } };
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { expertProfile: { updatedAt: 'desc' } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          expertProfile: true,
          expertExpertise: {
            where: { isPrimary: true },
            take: 3,
            include: { expertiseArea: { select: { name: true, slug: true } } },
          },
        },
      }),
    ]);

    return { total, rows };
  }

  async findPublicBySlug(slug: string) {
    const profile = await this.prisma.expertProfile.findUnique({
      where: { publicSlug: slug },
    });
    if (!profile || !profile.isPublic) {
      return null;
    }

    const user = await this.prisma.user.findFirst({
      where: { id: profile.userId, ...EXPERT_ROLE_FILTER },
      include: {
        expertExpertise: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
          include: { expertiseArea: { select: { name: true, slug: true } } },
        },
        expertServices: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!user) {
      return null;
    }

    return { profile, user };
  }

  async findPublicUserIdBySlug(slug: string): Promise<string | null> {
    const profile = await this.prisma.expertProfile.findUnique({
      where: { publicSlug: slug },
      select: { userId: true, isPublic: true },
    });
    if (!profile || !profile.isPublic) {
      return null;
    }
    return profile.userId;
  }

  async findPublicServiceBySlug(slug: string, serviceId: string) {
    const profile = await this.prisma.expertProfile.findUnique({
      where: { publicSlug: slug },
    });
    if (!profile || !profile.isPublic) {
      return null;
    }

    const service = await this.prisma.expertService.findUnique({ where: { id: serviceId } });
    if (!service || service.userId !== profile.userId || service.status !== 'ACTIVE') {
      return null;
    }

    return { expertUserId: profile.userId, service };
  }
}

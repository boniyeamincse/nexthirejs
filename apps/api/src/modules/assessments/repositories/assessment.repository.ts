import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { Prisma } from '../../../generated/prisma/client';

@Injectable()
export class AssessmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPublishedCatalog(
    where: Prisma.AssessmentWhereInput,
    orderBy: Prisma.AssessmentOrderByWithRelationInput[],
    skip: number,
    take: number,
  ) {
    return this.prisma.assessment.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy,
      skip,
      take,
    });
  }

  async countPublishedCatalog(where: Prisma.AssessmentWhereInput) {
    return this.prisma.assessment.count({ where });
  }

  async findPublishedByIdOrSlug(identifier: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    return this.prisma.assessment.findFirst({
      where: {
        status: 'PUBLISHED',
        visibility: 'CANDIDATE_CATALOG',
        category: { isActive: true },
        OR: isUuid ? [{ id: identifier }, { slug: identifier }] : [{ slug: identifier }],
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }

  async findByIdOrSlug(identifier: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    return this.prisma.assessment.findFirst({
      where: {
        OR: isUuid ? [{ id: identifier }, { slug: identifier }] : [{ slug: identifier }],
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }
}

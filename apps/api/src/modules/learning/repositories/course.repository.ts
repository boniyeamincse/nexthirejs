import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { Prisma } from '../../../generated/prisma/client';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class CourseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPublishedCatalog(
    where: Prisma.CourseWhereInput,
    orderBy: Prisma.CourseOrderByWithRelationInput[],
    skip: number,
    take: number,
  ) {
    return this.prisma.course.findMany({
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

  async countPublishedCatalog(where: Prisma.CourseWhereInput) {
    return this.prisma.course.count({ where });
  }

  async findPublishedByIdOrSlug(identifier: string) {
    return this.prisma.course.findFirst({
      where: {
        status: 'PUBLISHED',
        visibility: 'CANDIDATE_CATALOG',
        category: { isActive: true },
        OR: UUID_REGEX.test(identifier)
          ? [{ id: identifier }, { slug: identifier }]
          : [{ slug: identifier }],
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        modules: {
          orderBy: { sortOrder: 'asc' },
          include: {
            lessons: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });
  }

  async findByIdOrSlug(identifier: string) {
    return this.prisma.course.findFirst({
      where: {
        OR: UUID_REGEX.test(identifier)
          ? [{ id: identifier }, { slug: identifier }]
          : [{ slug: identifier }],
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }
}

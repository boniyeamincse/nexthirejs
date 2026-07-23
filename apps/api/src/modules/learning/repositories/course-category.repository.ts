import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class CourseCategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActive() {
    return this.prisma.courseCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' as const },
      select: { id: true, name: true, slug: true },
    });
  }
}

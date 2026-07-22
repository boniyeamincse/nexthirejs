import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AssessmentCategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActive() {
    return this.prisma.assessmentCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' as const },
      select: { id: true, name: true, slug: true },
    });
  }
}

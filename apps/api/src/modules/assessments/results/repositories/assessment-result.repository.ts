import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { Prisma } from '../../../../generated/prisma/client';

const attemptFullInclude = {
  questions: {
    include: {
      options: { orderBy: { sortOrder: 'asc' as const } },
      answer: true,
    },
    orderBy: { sortOrder: 'asc' as const },
  },
  sections: { orderBy: { sortOrder: 'asc' as const } },
} satisfies Prisma.AssessmentAttemptInclude;

export type AttemptWithFullData = Prisma.AssessmentAttemptGetPayload<{
  include: typeof attemptFullInclude;
}>;

@Injectable()
export class AssessmentResultRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAttemptByIdAndCandidate(
    attemptId: string,
    candidateId: string,
  ): Promise<AttemptWithFullData | null> {
    const attempt = await this.prisma.assessmentAttempt.findFirst({
      where: { id: attemptId, candidateId },
      include: attemptFullInclude,
    });
    return attempt as AttemptWithFullData | null;
  }

  async findAttemptById(attemptId: string): Promise<AttemptWithFullData | null> {
    const attempt = await this.prisma.assessmentAttempt.findFirst({
      where: { id: attemptId },
      include: attemptFullInclude,
    });
    return attempt as AttemptWithFullData | null;
  }

  async countCandidateAttempts(
    candidateId: string,
    where?: Prisma.AssessmentAttemptWhereInput,
  ): Promise<number> {
    return this.prisma.assessmentAttempt.count({
      where: { candidateId, ...where },
    });
  }

  async findCandidateAttempts(
    candidateId: string,
    skip: number,
    take: number,
    orderBy: Prisma.AssessmentAttemptOrderByWithRelationInput,
    where?: Prisma.AssessmentAttemptWhereInput,
  ): Promise<AttemptWithFullData[]> {
    const attempts = await this.prisma.assessmentAttempt.findMany({
      where: { candidateId, ...where },
      include: attemptFullInclude,
      skip,
      take,
      orderBy,
    });
    return attempts as AttemptWithFullData[];
  }
}

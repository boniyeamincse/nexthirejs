import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { AssessmentAttemptProgress } from '@nexthire/types';

@Injectable()
export class AssessmentAttemptProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateProgress(attemptId: string): Promise<AssessmentAttemptProgress> {
    const questions = await this.prisma.assessmentAttemptQuestion.findMany({
      where: { attemptId },
      include: {
        answer: true,
      },
    });

    const total = questions.length;
    let answered = 0;

    for (const q of questions) {
      if (!q.answer) continue;

      const hasOption = q.answer.selectedOptionIds.length > 0;
      const hasText = q.answer.shortTextAnswer && q.answer.shortTextAnswer.trim().length > 0;

      if (hasOption || hasText) {
        answered++;
      }
    }

    const unanswered = total - answered;
    const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;

    return {
      answered,
      unanswered,
      total,
      percentage,
    };
  }
}

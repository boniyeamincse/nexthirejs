import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface CvReadinessResult {
  ready: boolean;
  missingSections: string[];
  completionScore: number;
}

const REQUIRED_SECTIONS = ['professional_summary'];
const SCORED_SECTIONS = [
  'professional_summary',
  'education',
  'work_experience',
  'skills',
  'projects',
  'certifications',
  'languages',
  'achievements',
];

function hasContent(content: unknown): boolean {
  if (!content || typeof content !== 'object') return false;
  const obj = content as Record<string, unknown>;
  if (Array.isArray(obj.items)) return obj.items.length > 0;
  if (typeof obj.summary === 'string') return obj.summary.trim().length > 0;
  return Object.keys(obj).length > 0;
}

@Injectable()
export class CvReadinessService {
  constructor(private readonly prisma: PrismaService) {}

  /** Owner-scoped: throws 404 for missing or cross-user CVs to avoid leaking existence. */
  async checkReadiness(userId: string, cvId: string): Promise<CvReadinessResult> {
    const cv = await this.prisma.cv.findUnique({
      where: { id: cvId },
      include: { sectionContents: true },
    });

    if (!cv || cv.userId !== userId) {
      throw new NotFoundException('CV_NOT_FOUND');
    }

    const contentByType = new Map(cv.sectionContents.map((c) => [c.sectionType, c.content]));

    const missingSections = REQUIRED_SECTIONS.filter(
      (type) => !hasContent(contentByType.get(type)),
    );
    const scoredPresent = SCORED_SECTIONS.filter((type) =>
      hasContent(contentByType.get(type)),
    ).length;
    const completionScore = Math.round((scoredPresent / SCORED_SECTIONS.length) * 100);

    await this.prisma.cv.update({
      where: { id: cvId },
      data: { completionScore },
    });

    return {
      ready: missingSections.length === 0,
      missingSections,
      completionScore,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { ExpertApplicationStatusValue, ExpertApplicationListQuery } from '@nexthire/types';

/**
 * Statuses considered "active" — a user may hold at most one application in
 * any of these states at a time.
 */
export const ACTIVE_APPLICATION_STATUSES: ExpertApplicationStatusValue[] = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'CHANGES_REQUESTED',
];

const DOCUMENT_SELECT = {
  where: { removedAt: null },
  orderBy: { uploadedAt: 'asc' as const },
};

@Injectable()
export class ExpertApplicationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveByUserId(userId: string) {
    return this.prisma.expertApplication.findFirst({
      where: { userId, status: { in: ACTIVE_APPLICATION_STATUSES } },
      include: { documents: DOCUMENT_SELECT },
    });
  }

  findByIdForUser(applicationId: string, userId: string) {
    return this.prisma.expertApplication.findFirst({
      where: { id: applicationId, userId },
      include: { documents: DOCUMENT_SELECT },
    });
  }

  findByIdWithProfile(applicationId: string) {
    return this.prisma.expertApplication.findUnique({
      where: { id: applicationId },
      include: {
        documents: DOCUMENT_SELECT,
        expertProfile: true,
        user: { select: { id: true, email: true } },
      },
    });
  }

  createDraft(userId: string, expertProfileId: string) {
    return this.prisma.expertApplication.create({
      data: { userId, expertProfileId, status: 'DRAFT' },
      include: { documents: DOCUMENT_SELECT },
    });
  }

  updateStatus(applicationId: string, data: Record<string, unknown>) {
    return this.prisma.expertApplication.update({
      where: { id: applicationId },
      data,
      include: { documents: DOCUMENT_SELECT },
    });
  }

  /**
   * Admin queue listing with filters + pagination.
   */
  async listForReview(
    query: Required<Pick<ExpertApplicationListQuery, 'page' | 'pageSize'>> &
      ExpertApplicationListQuery,
  ) {
    const { page, pageSize } = query;
    const where: Record<string, unknown> = {};

    if (query.status) {
      where.status = query.status;
    } else {
      // Default queue: everything that is or was submitted for review.
      where.status = { in: ['SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED'] };
    }

    if (query.submittedFrom || query.submittedTo) {
      where.submittedAt = {
        ...(query.submittedFrom ? { gte: new Date(query.submittedFrom) } : {}),
        ...(query.submittedTo ? { lte: new Date(query.submittedTo) } : {}),
      };
    }

    const profileFilter: Record<string, unknown> = {};
    if (query.country) profileFilter.countryId = query.country;
    if (query.search) {
      profileFilter.professionalTitle = { contains: query.search, mode: 'insensitive' };
    }
    if (Object.keys(profileFilter).length > 0) {
      where.expertProfile = profileFilter;
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.expertApplication.count({ where }),
      this.prisma.expertApplication.findMany({
        where,
        orderBy: [{ submittedAt: 'asc' }, { createdAt: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          expertProfile: {
            select: { professionalTitle: true, yearsOfExperience: true, countryId: true },
          },
          _count: { select: { documents: { where: { removedAt: null } } } },
        },
      }),
    ]);

    return { total, rows };
  }

  /**
   * Transactionally approves an application and assigns the expert role.
   *
   * - Marks the application APPROVED with reviewer metadata.
   * - Ensures a UserRole row for the `expert` role exists (idempotent).
   *
   * The whole operation is atomic: role assignment and status change either
   * both commit or both roll back.
   */
  async approveWithRoleAssignment(params: {
    applicationId: string;
    userId: string;
    reviewerId: string;
    reviewerNote?: string | null;
    now: Date;
  }): Promise<{ roleNewlyAssigned: boolean }> {
    const { applicationId, userId, reviewerId, reviewerNote, now } = params;

    return this.prisma.$transaction(async (tx) => {
      const expertRole = await tx.role.findUnique({ where: { code: 'expert' } });
      if (!expertRole) {
        throw new Error('EXPERT_ROLE_NOT_SEEDED');
      }

      await tx.expertApplication.update({
        where: { id: applicationId },
        data: {
          status: 'APPROVED',
          reviewedById: reviewerId,
          reviewedAt: now,
          approvedAt: now,
          reviewerNote: reviewerNote ?? null,
          decisionReasonCode: null,
        },
      });

      const existing = await tx.userRole.findUnique({
        where: { userId_roleId: { userId, roleId: expertRole.id } },
      });

      if (existing) {
        return { roleNewlyAssigned: false };
      }

      await tx.userRole.create({ data: { userId, roleId: expertRole.id } });
      return { roleNewlyAssigned: true };
    });
  }
}

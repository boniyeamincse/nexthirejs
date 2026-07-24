import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { CompanyVerificationStatusValue, CompanyApplicationListQuery } from '@nexthire/types';

/**
 * Statuses considered "active" — a company may have at most one application
 * in any of these states at a time.
 */
export const ACTIVE_COMPANY_APPLICATION_STATUSES: CompanyVerificationStatusValue[] = [
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
export class CompanyApplicationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveByCompanyId(companyId: string) {
    return this.prisma.companyVerificationApplication.findFirst({
      where: { companyId, status: { in: ACTIVE_COMPANY_APPLICATION_STATUSES } },
      include: { documents: DOCUMENT_SELECT },
    });
  }

  /** NH-M21: a company has at most one application ever (companyId is unique). */
  isApproved(companyId: string): Promise<boolean> {
    return this.prisma.companyVerificationApplication
      .count({ where: { companyId, status: 'APPROVED' } })
      .then((n) => n > 0);
  }

  findByIdWithCompany(applicationId: string) {
    return this.prisma.companyVerificationApplication.findUnique({
      where: { id: applicationId },
      include: {
        documents: DOCUMENT_SELECT,
        company: true,
      },
    });
  }

  createDraft(companyId: string) {
    return this.prisma.companyVerificationApplication.create({
      data: { companyId, status: 'DRAFT' },
      include: { documents: DOCUMENT_SELECT },
    });
  }

  updateStatus(applicationId: string, data: Record<string, unknown>) {
    return this.prisma.companyVerificationApplication.update({
      where: { id: applicationId },
      data,
      include: { documents: DOCUMENT_SELECT },
    });
  }

  async listForReview(
    query: Required<Pick<CompanyApplicationListQuery, 'page' | 'pageSize'>> &
      CompanyApplicationListQuery,
  ) {
    const { page, pageSize } = query;
    const where: Record<string, unknown> = {};

    if (query.status) {
      where.status = query.status;
    } else {
      where.status = { in: ['SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED'] };
    }

    if (query.submittedFrom || query.submittedTo) {
      where.submittedAt = {
        ...(query.submittedFrom ? { gte: new Date(query.submittedFrom) } : {}),
        ...(query.submittedTo ? { lte: new Date(query.submittedTo) } : {}),
      };
    }

    if (query.search) {
      where.company = { name: { contains: query.search, mode: 'insensitive' } };
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.companyVerificationApplication.count({ where }),
      this.prisma.companyVerificationApplication.findMany({
        where,
        orderBy: [{ submittedAt: 'asc' }, { createdAt: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          company: { select: { name: true, industry: true, headquartersCountryId: true } },
          _count: { select: { documents: { where: { removedAt: null } } } },
        },
      }),
    ]);

    return { total, rows };
  }

  /**
   * Transactionally approves an application and assigns the `company` role
   * to the owning user.
   */
  async approveWithRoleAssignment(params: {
    applicationId: string;
    ownerUserId: string;
    reviewerId: string;
    reviewerNote?: string | null;
    now: Date;
  }): Promise<{ roleNewlyAssigned: boolean }> {
    const { applicationId, ownerUserId, reviewerId, reviewerNote, now } = params;

    return this.prisma.$transaction(async (tx) => {
      const companyRole = await tx.role.findUnique({ where: { code: 'company' } });
      if (!companyRole) {
        throw new Error('COMPANY_ROLE_NOT_SEEDED');
      }

      await tx.companyVerificationApplication.update({
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
        where: { userId_roleId: { userId: ownerUserId, roleId: companyRole.id } },
      });

      if (existing) {
        return { roleNewlyAssigned: false };
      }

      await tx.userRole.create({ data: { userId: ownerUserId, roleId: companyRole.id } });
      return { roleNewlyAssigned: true };
    });
  }
}

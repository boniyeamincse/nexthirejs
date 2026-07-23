import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class ExpertEligibilityService {
  constructor(private readonly prisma: PrismaService) {}

  async requireApprovedExpert(userId: string): Promise<void> {
    const profile = await this.prisma.expertProfile.findUnique({
      where: { userId },
      include: {
        applications: {
          where: { status: 'APPROVED' },
          take: 1,
          orderBy: { approvedAt: 'desc' },
        },
      },
    });

    if (!profile) {
      throw new ForbiddenException('Expert profile not found');
    }

    if (profile.applications.length === 0) {
      throw new ForbiddenException('Expert application must be approved first');
    }
  }
}

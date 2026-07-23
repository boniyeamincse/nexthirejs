import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard, AuthenticatedRequest } from '../../../modules/auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { ExpertEligibilityGuard } from '../shared/expert-eligibility.guard';
import { PrismaService } from '../../../database/prisma.service';
import { AuditService } from '../../../modules/audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import { expertExpertiseSchema } from '@nexthire/validation';
import { EXPERT_OFFERING_RATE_LIMITS } from '@nexthire/constants';

const HOUR_MS = 3_600_000;

@ApiTags('Expert Expertise')
@ApiBearerAuth('access-token')
@Controller('expert/expertise')
@UseGuards(AuthGuard, RolesGuard, ExpertEligibilityGuard)
@RequireRoles('expert')
export class ExpertExpertiseController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get current user expertise areas' })
  @ApiResponse({ status: 200, description: 'List of expertise entries' })
  async getExpertise(@Req() req: AuthenticatedRequest) {
    const items = await this.prisma.expertExpertise.findMany({
      where: { userId: req.principal.userId },
      include: { expertiseArea: { select: { slug: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return {
      items: items.map((e) => ({
        id: e.id,
        expertiseAreaId: e.expertiseAreaId,
        expertiseAreaSlug: e.expertiseArea.slug,
        expertiseAreaName: e.expertiseArea.name,
        level: e.level,
        yearsExperience: e.yearsExperience,
        isPrimary: e.isPrimary,
      })),
    };
  }

  @Put()
  @Throttle({
    default: { limit: EXPERT_OFFERING_RATE_LIMITS.EXPERTISE_UPDATE_PER_HOUR, ttl: HOUR_MS },
  })
  @ApiOperation({ summary: 'Set/replace all expertise areas for the current user' })
  @ApiResponse({ status: 200, description: 'Expertise areas updated' })
  async setExpertise(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parsed = expertExpertiseSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'EXPERT_EXPERTISE_VALIDATION_FAILED',
        details: parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    const userId = req.principal.userId;

    await this.prisma.$transaction(async (tx) => {
      await tx.expertExpertise.deleteMany({ where: { userId } });

      if (parsed.data.items.length > 0) {
        await tx.expertExpertise.createMany({
          data: parsed.data.items.map((item) => ({
            userId,
            expertiseAreaId: item.expertiseAreaId,
            level: item.level,
            yearsExperience: item.yearsExperience ?? null,
            isPrimary: item.isPrimary ?? false,
          })),
        });
      }
    });

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'expert.expertise.updated',
      targetType: 'ExpertExpertise',
      targetId: userId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { itemCount: parsed.data.items.length },
    });

    const items = await this.prisma.expertExpertise.findMany({
      where: { userId },
      include: { expertiseArea: { select: { slug: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return {
      items: items.map((e) => ({
        id: e.id,
        expertiseAreaId: e.expertiseAreaId,
        expertiseAreaSlug: e.expertiseArea.slug,
        expertiseAreaName: e.expertiseArea.name,
        level: e.level,
        yearsExperience: e.yearsExperience,
        isPrimary: e.isPrimary,
      })),
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a specific expertise entry' })
  @ApiResponse({ status: 200, description: 'Expertise entry removed' })
  async deleteExpertise(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const userId = req.principal.userId;
    const entry = await this.prisma.expertExpertise.findUnique({ where: { id } });

    if (!entry || entry.userId !== userId) {
      throw new NotFoundException('Expertise entry not found');
    }

    await this.prisma.expertExpertise.delete({ where: { id } });

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'expert.expertise.deleted',
      targetType: 'ExpertExpertise',
      targetId: id,
      outcome: AuditOutcome.SUCCESS,
    });

    return { removed: true };
  }
}

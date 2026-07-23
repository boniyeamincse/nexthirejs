import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
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
import { expertServiceSchema, serviceLifecycleActionSchema } from '@nexthire/validation';
import { EXPERT_OFFERING_RATE_LIMITS, EXPERT_SERVICE_STATUSES } from '@nexthire/constants';

const HOUR_MS = 3_600_000;

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['ACTIVE'],
  ACTIVE: ['INACTIVE', 'ARCHIVED'],
  INACTIVE: ['ACTIVE', 'ARCHIVED'],
  ARCHIVED: [],
};

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

@ApiTags('Expert Services')
@ApiBearerAuth('access-token')
@Controller('expert/services')
@UseGuards(AuthGuard, RolesGuard, ExpertEligibilityGuard)
@RequireRoles('expert')
export class ExpertServiceController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List current user services' })
  @ApiResponse({ status: 200, description: 'List of services' })
  async listServices(@Req() req: AuthenticatedRequest, @Query('status') status?: string) {
    const where: Record<string, unknown> = { userId: req.principal.userId };
    if (status) {
      if (!EXPERT_SERVICE_STATUSES.includes(status as (typeof EXPERT_SERVICE_STATUSES)[number])) {
        throw new BadRequestException({
          code: 'EXPERT_SERVICE_VALIDATION_FAILED',
          details: [{ field: 'status', message: 'Invalid status' }],
        });
      }
      where.status = status;
    }

    const services = await this.prisma.expertService.findMany({
      where,
      include: { expertiseArea: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return services.map((s) => ({
      id: s.id,
      expertiseAreaId: s.expertiseAreaId,
      expertiseAreaName: s.expertiseArea.name,
      type: s.type,
      title: s.title,
      shortDescription: s.shortDescription,
      detailedDescription: s.detailedDescription,
      durationMinutes: s.durationMinutes,
      price: { amount: s.priceAmount.toString(), currency: s.priceCurrency },
      languageCodes: s.languageCodes,
      preparationInstructions: s.preparationInstructions,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  }

  @Post()
  @Throttle({
    default: { limit: EXPERT_OFFERING_RATE_LIMITS.SERVICE_CREATE_UPDATE_PER_HOUR, ttl: HOUR_MS },
  })
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({ status: 201, description: 'Service created' })
  async createService(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parsed = expertServiceSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'EXPERT_SERVICE_VALIDATION_FAILED',
        details: parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    const userId = req.principal.userId;

    const service = await this.prisma.expertService.create({
      data: {
        userId,
        expertiseAreaId: parsed.data.expertiseAreaId,
        type: parsed.data.type,
        title: parsed.data.title,
        shortDescription: parsed.data.shortDescription,
        detailedDescription: parsed.data.detailedDescription,
        durationMinutes: parsed.data.durationMinutes,
        priceAmount: parsed.data.price.amount,
        priceCurrency: parsed.data.price.currency,
        languageCodes: parsed.data.languageCodes,
        preparationInstructions: parsed.data.preparationInstructions ?? null,
        status: 'DRAFT',
      },
      include: { expertiseArea: { select: { name: true } } },
    });

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'expert.service.created',
      targetType: 'ExpertService',
      targetId: service.id,
      outcome: AuditOutcome.SUCCESS,
    });

    return {
      id: service.id,
      expertiseAreaId: service.expertiseAreaId,
      expertiseAreaName: service.expertiseArea.name,
      type: service.type,
      title: service.title,
      shortDescription: service.shortDescription,
      detailedDescription: service.detailedDescription,
      durationMinutes: service.durationMinutes,
      price: { amount: service.priceAmount.toString(), currency: service.priceCurrency },
      languageCodes: service.languageCodes,
      preparationInstructions: service.preparationInstructions,
      status: service.status,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service detail' })
  @ApiResponse({ status: 200, description: 'Service detail' })
  async getService(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const userId = req.principal.userId;
    const service = await this.prisma.expertService.findUnique({
      where: { id },
      include: { expertiseArea: { select: { name: true } } },
    });

    if (!service || service.userId !== userId) {
      throw new NotFoundException('Service not found');
    }

    return {
      id: service.id,
      expertiseAreaId: service.expertiseAreaId,
      expertiseAreaName: service.expertiseArea.name,
      type: service.type,
      title: service.title,
      shortDescription: service.shortDescription,
      detailedDescription: service.detailedDescription,
      durationMinutes: service.durationMinutes,
      price: { amount: service.priceAmount.toString(), currency: service.priceCurrency },
      languageCodes: service.languageCodes,
      preparationInstructions: service.preparationInstructions,
      status: service.status,
      activatedAt: service.activatedAt?.toISOString() ?? null,
      deactivatedAt: service.deactivatedAt?.toISOString() ?? null,
      archivedAt: service.archivedAt?.toISOString() ?? null,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    };
  }

  @Patch(':id')
  @Throttle({
    default: { limit: EXPERT_OFFERING_RATE_LIMITS.SERVICE_CREATE_UPDATE_PER_HOUR, ttl: HOUR_MS },
  })
  @ApiOperation({ summary: 'Update service (only if DRAFT or INACTIVE)' })
  @ApiResponse({ status: 200, description: 'Service updated' })
  async updateService(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const userId = req.principal.userId;
    const existing = await this.prisma.expertService.findUnique({ where: { id } });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Service not found');
    }

    if (existing.status !== 'DRAFT' && existing.status !== 'INACTIVE') {
      throw new ForbiddenException({
        code: 'EXPERT_SERVICE_VALIDATION_FAILED',
        details: [{ field: 'status', message: 'Only DRAFT or INACTIVE services can be updated' }],
      });
    }

    const parsed = expertServiceSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'EXPERT_SERVICE_VALIDATION_FAILED',
        details: parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    const service = await this.prisma.expertService.update({
      where: { id },
      data: {
        expertiseAreaId: parsed.data.expertiseAreaId,
        type: parsed.data.type,
        title: parsed.data.title,
        shortDescription: parsed.data.shortDescription,
        detailedDescription: parsed.data.detailedDescription,
        durationMinutes: parsed.data.durationMinutes,
        priceAmount: parsed.data.price.amount,
        priceCurrency: parsed.data.price.currency,
        languageCodes: parsed.data.languageCodes,
        preparationInstructions: parsed.data.preparationInstructions ?? null,
      },
      include: { expertiseArea: { select: { name: true } } },
    });

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'expert.service.updated',
      targetType: 'ExpertService',
      targetId: id,
      outcome: AuditOutcome.SUCCESS,
    });

    return {
      id: service.id,
      expertiseAreaId: service.expertiseAreaId,
      expertiseAreaName: service.expertiseArea.name,
      type: service.type,
      title: service.title,
      shortDescription: service.shortDescription,
      detailedDescription: service.detailedDescription,
      durationMinutes: service.durationMinutes,
      price: { amount: service.priceAmount.toString(), currency: service.priceCurrency },
      languageCodes: service.languageCodes,
      preparationInstructions: service.preparationInstructions,
      status: service.status,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    };
  }

  @Post(':id/lifecycle')
  @Throttle({
    default: { limit: EXPERT_OFFERING_RATE_LIMITS.SERVICE_LIFECYCLE_PER_HOUR, ttl: HOUR_MS },
  })
  @ApiOperation({ summary: 'Perform lifecycle action on a service' })
  @ApiResponse({ status: 200, description: 'Lifecycle action applied' })
  async lifecycleAction(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const parsed = serviceLifecycleActionSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'EXPERT_SERVICE_VALIDATION_FAILED',
        details: parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    const userId = req.principal.userId;
    const existing = await this.prisma.expertService.findUnique({ where: { id } });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Service not found');
    }

    const action = parsed.data.action;
    const targetStatus: Record<string, string> = {
      activate: 'ACTIVE',
      deactivate: 'INACTIVE',
      archive: 'ARCHIVED',
    };

    const newStatus = targetStatus[action];
    const allowed = VALID_TRANSITIONS[existing.status];

    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestException({
        code: 'EXPERT_SERVICE_TRANSITION_INVALID',
        details: [
          { field: 'action', message: `Cannot transition from ${existing.status} to ${newStatus}` },
        ],
      });
    }

    const updateData: Record<string, unknown> = { status: newStatus };

    if (action === 'activate') {
      updateData.activatedAt = new Date();
    } else if (action === 'deactivate') {
      updateData.deactivatedAt = new Date();
    } else if (action === 'archive') {
      updateData.archivedAt = new Date();
    }

    const service = await this.prisma.expertService.update({
      where: { id },
      data: updateData,
      include: { expertiseArea: { select: { name: true } } },
    });

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: `expert.service.${action}d`,
      targetType: 'ExpertService',
      targetId: id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { fromStatus: existing.status, toStatus: newStatus },
    });

    return {
      id: service.id,
      expertiseAreaId: service.expertiseAreaId,
      expertiseAreaName: service.expertiseArea.name,
      type: service.type,
      title: service.title,
      shortDescription: service.shortDescription,
      detailedDescription: service.detailedDescription,
      durationMinutes: service.durationMinutes,
      price: { amount: service.priceAmount.toString(), currency: service.priceCurrency },
      languageCodes: service.languageCodes,
      preparationInstructions: service.preparationInstructions,
      status: service.status,
      activatedAt: service.activatedAt?.toISOString() ?? null,
      deactivatedAt: service.deactivatedAt?.toISOString() ?? null,
      archivedAt: service.archivedAt?.toISOString() ?? null,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    };
  }

  @Get(':id/readiness')
  @ApiOperation({ summary: 'Check service readiness' })
  @ApiResponse({ status: 200, description: 'Service readiness check result' })
  async checkReadiness(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const userId = req.principal.userId;
    const service = await this.prisma.expertService.findUnique({ where: { id } });

    if (!service || service.userId !== userId) {
      throw new NotFoundException('Service not found');
    }

    const blockers: Array<{ code: string; message: string; field?: string }> = [];

    const area = await this.prisma.expertiseArea.findUnique({
      where: { id: service.expertiseAreaId },
    });
    if (!area || !area.isActive) {
      blockers.push({
        code: 'EXPERTISE_AREA_INVALID',
        message: 'Expertise area does not exist or is inactive',
        field: 'expertiseAreaId',
      });
    }

    if (![30, 35, 40].includes(service.durationMinutes)) {
      blockers.push({
        code: 'DURATION_INVALID',
        message: 'Duration must be 30, 35, or 40 minutes',
        field: 'durationMinutes',
      });
    }

    const priceNum = Number(service.priceAmount);
    if (isNaN(priceNum) || priceNum <= 0) {
      blockers.push({
        code: 'PRICE_INVALID',
        message: 'Price must be greater than 0',
        field: 'price',
      });
    }

    if (!service.languageCodes || service.languageCodes.length === 0) {
      blockers.push({
        code: 'LANGUAGES_EMPTY',
        message: 'At least one language must be specified',
        field: 'languageCodes',
      });
    }

    return { ready: blockers.length === 0, blockers };
  }
}

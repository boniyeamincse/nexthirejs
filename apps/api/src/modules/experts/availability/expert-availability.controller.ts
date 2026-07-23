import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Param,
  Query,
  Req,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../modules/auth/auth.guard';
import type { AuthenticatedRequest } from '../../../modules/auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { ExpertEligibilityGuard } from '../shared/expert-eligibility.guard';
import { PrismaService } from '../../../database/prisma.service';
import { AuditService } from '../../../modules/audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import {
  expertAvailabilityProfileSchema,
  expertWeeklyAvailabilitySchema,
  expertAvailabilityOverrideSchema,
  expertAvailabilitySlotPreviewQuerySchema,
} from '@nexthire/validation';
import { EXPERT_OFFERING_RATE_LIMITS } from '@nexthire/constants';
import { ExpertSlotService } from './expert-slot.service';

const HOUR_MS = 3_600_000;

function parseTimeToMinutes(time: string): number {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return h * 60 + m;
}

interface OverrideWindow {
  startLocalTime: string;
  endLocalTime: string;
}

function mapWindows(windows: unknown): { startLocalMinutes: number; endLocalMinutes: number }[] {
  if (!Array.isArray(windows)) return [];
  return (windows as OverrideWindow[]).map((w) => ({
    startLocalMinutes: parseTimeToMinutes(w.startLocalTime),
    endLocalMinutes: parseTimeToMinutes(w.endLocalTime),
  }));
}

@ApiTags('Expert Availability')
@ApiBearerAuth('access-token')
@Controller('expert/availability')
@UseGuards(AuthGuard, RolesGuard, ExpertEligibilityGuard)
@RequireRoles('expert')
export class ExpertAvailabilityController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly slotService: ExpertSlotService,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get availability profile' })
  @ApiResponse({ status: 200, description: 'Availability profile' })
  async getProfile(@Req() req: AuthenticatedRequest) {
    const userId = req.principal.userId;
    const profile = await this.prisma.expertAvailabilityProfile.findUnique({ where: { userId } });

    if (!profile) return null;

    return {
      id: profile.id,
      timezone: profile.timezone,
      bufferBeforeMinutes: profile.bufferBeforeMinutes,
      bufferAfterMinutes: profile.bufferAfterMinutes,
      minimumNoticeHours: profile.minimumNoticeHours,
      bookingWindowDays: profile.bookingWindowDays,
    };
  }

  @Put('profile')
  @Throttle({
    default: {
      limit: EXPERT_OFFERING_RATE_LIMITS.AVAILABILITY_PROFILE_UPDATE_PER_HOUR,
      ttl: HOUR_MS,
    },
  })
  @ApiOperation({ summary: 'Create or update availability profile' })
  @ApiResponse({ status: 200, description: 'Availability profile updated' })
  async upsertProfile(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parsed = expertAvailabilityProfileSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'EXPERT_AVAILABILITY_VALIDATION_FAILED',
        details: parsed.error.issues.map((i: { path: (string | number)[]; message: string }) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    const userId = req.principal.userId;

    const profile = await this.prisma.expertAvailabilityProfile.upsert({
      where: { userId },
      create: {
        userId,
        timezone: parsed.data.timezone,
        bufferBeforeMinutes: parsed.data.bufferBeforeMinutes,
        bufferAfterMinutes: parsed.data.bufferAfterMinutes,
        minimumNoticeHours: parsed.data.minimumNoticeHours,
        bookingWindowDays: parsed.data.bookingWindowDays,
      },
      update: {
        timezone: parsed.data.timezone,
        bufferBeforeMinutes: parsed.data.bufferBeforeMinutes,
        bufferAfterMinutes: parsed.data.bufferAfterMinutes,
        minimumNoticeHours: parsed.data.minimumNoticeHours,
        bookingWindowDays: parsed.data.bookingWindowDays,
      },
    });

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'expert.availability.profile.updated',
      targetType: 'ExpertAvailabilityProfile',
      targetId: profile.id,
      outcome: AuditOutcome.SUCCESS,
    });

    return {
      id: profile.id,
      timezone: profile.timezone,
      bufferBeforeMinutes: profile.bufferBeforeMinutes,
      bufferAfterMinutes: profile.bufferAfterMinutes,
      minimumNoticeHours: profile.minimumNoticeHours,
      bookingWindowDays: profile.bookingWindowDays,
    };
  }

  @Get('weekly')
  @ApiOperation({ summary: 'Get weekly availability windows' })
  @ApiResponse({ status: 200, description: 'Weekly windows' })
  async getWeekly(@Req() req: AuthenticatedRequest) {
    const userId = req.principal.userId;
    const profile = await this.prisma.expertAvailabilityProfile.findUnique({
      where: { userId },
      include: { weekly: true },
    });

    if (!profile) {
      return { windows: [], timezone: 'UTC' };
    }

    return {
      windows: profile.weekly.map((w) => ({
        id: w.id,
        dayOfWeek: w.dayOfWeek,
        startLocalMinutes: parseTimeToMinutes(w.startLocalTime),
        endLocalMinutes: parseTimeToMinutes(w.endLocalTime),
      })),
      timezone: profile.timezone,
    };
  }

  @Put('weekly')
  @Throttle({
    default: {
      limit: EXPERT_OFFERING_RATE_LIMITS.AVAILABILITY_PROFILE_UPDATE_PER_HOUR,
      ttl: HOUR_MS,
    },
  })
  @ApiOperation({ summary: 'Replace all weekly availability windows' })
  @ApiResponse({ status: 200, description: 'Weekly windows updated' })
  async setWeekly(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parsed = expertWeeklyAvailabilitySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'EXPERT_AVAILABILITY_VALIDATION_FAILED',
        details: parsed.error.issues.map((i: { path: (string | number)[]; message: string }) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    const userId = req.principal.userId;
    const windows = parsed.data.windows as Array<{
      dayOfWeek: number;
      startLocalTime: string;
      endLocalTime: string;
    }>;

    for (const day of new Set(windows.map((w) => w.dayOfWeek))) {
      const dayWindows = windows.filter((w) => w.dayOfWeek === day);
      for (let i = 0; i < dayWindows.length; i++) {
        for (let j = i + 1; j < dayWindows.length; j++) {
          const a = dayWindows[i];
          const b = dayWindows[j];
          if (!a || !b) continue;
          const aStart = parseTimeToMinutes(a.startLocalTime);
          const aEnd = parseTimeToMinutes(a.endLocalTime);
          const bStart = parseTimeToMinutes(b.startLocalTime);
          const bEnd = parseTimeToMinutes(b.endLocalTime);
          if (aStart < bEnd && bStart < aEnd) {
            throw new BadRequestException({
              code: 'EXPERT_AVAILABILITY_OVERLAP',
              details: [{ field: 'windows', message: `Overlapping windows on day ${day}` }],
            });
          }
        }
      }
    }

    let profile = await this.prisma.expertAvailabilityProfile.findUnique({ where: { userId } });
    if (!profile) {
      profile = await this.prisma.expertAvailabilityProfile.create({
        data: { userId, timezone: 'UTC' },
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.expertWeeklyAvailability.deleteMany({
        where: { availabilityProfileId: profile.id },
      });

      if (windows.length > 0) {
        await tx.expertWeeklyAvailability.createMany({
          data: windows.map((w) => ({
            availabilityProfileId: profile.id,
            dayOfWeek: w.dayOfWeek,
            startLocalTime: w.startLocalTime,
            endLocalTime: w.endLocalTime,
          })),
        });
      }
    });

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'expert.availability.weekly.updated',
      targetType: 'ExpertAvailabilityProfile',
      targetId: profile.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { windowCount: windows.length },
    });

    const updated = await this.prisma.expertAvailabilityProfile.findUnique({
      where: { userId },
      include: { weekly: true },
    });

    return {
      windows: (updated?.weekly ?? []).map((w) => ({
        id: w.id,
        dayOfWeek: w.dayOfWeek,
        startLocalMinutes: parseTimeToMinutes(w.startLocalTime),
        endLocalMinutes: parseTimeToMinutes(w.endLocalTime),
      })),
      timezone: profile.timezone,
    };
  }

  @Get('overrides')
  @ApiOperation({ summary: 'List availability overrides for a date range' })
  @ApiResponse({ status: 200, description: 'List of overrides' })
  async listOverrides(
    @Req() req: AuthenticatedRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const userId = req.principal.userId;
    const profile = await this.prisma.expertAvailabilityProfile.findUnique({ where: { userId } });

    if (!profile) return [];

    const where: Record<string, unknown> = { availabilityProfileId: profile.id };

    if (from || to) {
      const dateFilter: Record<string, string> = {};
      if (from) dateFilter.gte = from;
      if (to) dateFilter.lte = to;
      where.localDate = dateFilter;
    }

    const overrides = await this.prisma.expertAvailabilityOverride.findMany({
      where,
      orderBy: { localDate: 'asc' },
    });

    return overrides.map((o) => ({
      id: o.id,
      localDate: o.localDate,
      type: o.type,
      reason: o.reason,
      windows: mapWindows(o.windows),
    }));
  }

  @Post('overrides')
  @Throttle({
    default: { limit: EXPERT_OFFERING_RATE_LIMITS.OVERRIDE_CHANGES_PER_HOUR, ttl: HOUR_MS },
  })
  @ApiOperation({ summary: 'Create an availability override' })
  @ApiResponse({ status: 201, description: 'Override created' })
  async createOverride(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parsed = expertAvailabilityOverrideSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'EXPERT_AVAILABILITY_VALIDATION_FAILED',
        details: parsed.error.issues.map((i: { path: (string | number)[]; message: string }) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    const userId = req.principal.userId;

    let profile = await this.prisma.expertAvailabilityProfile.findUnique({ where: { userId } });
    if (!profile) {
      profile = await this.prisma.expertAvailabilityProfile.create({
        data: { userId, timezone: 'UTC' },
      });
    }

    const existing = await this.prisma.expertAvailabilityOverride.findUnique({
      where: {
        availabilityProfileId_localDate: {
          availabilityProfileId: profile.id,
          localDate: parsed.data.localDate,
        },
      },
    });

    if (existing) {
      throw new BadRequestException({
        code: 'EXPERT_AVAILABILITY_OVERRIDE_EXISTS',
        details: [{ field: 'localDate', message: 'An override already exists for this date' }],
      });
    }

    const override = await this.prisma.expertAvailabilityOverride.create({
      data: {
        availabilityProfileId: profile.id,
        localDate: parsed.data.localDate,
        type: parsed.data.type,
        reason: parsed.data.reason ?? null,
        windows: (parsed.data.windows ?? null) as unknown as any,
      },
    });

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'expert.availability.override.created',
      targetType: 'ExpertAvailabilityOverride',
      targetId: override.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { localDate: override.localDate, type: override.type },
    });

    return {
      id: override.id,
      localDate: override.localDate,
      type: override.type,
      reason: override.reason,
      windows: mapWindows(override.windows),
    };
  }

  @Delete('overrides/:id')
  @ApiOperation({ summary: 'Delete an availability override (owner only)' })
  @ApiResponse({ status: 200, description: 'Override deleted' })
  async deleteOverride(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const userId = req.principal.userId;
    const override = await this.prisma.expertAvailabilityOverride.findUnique({
      where: { id },
      include: { availabilityProfile: { select: { userId: true } } },
    });

    if (!override) {
      throw new NotFoundException('Override not found');
    }

    if (override.availabilityProfile.userId !== userId) {
      throw new NotFoundException('Override not found');
    }

    await this.prisma.expertAvailabilityOverride.delete({ where: { id } });

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'expert.availability.override.deleted',
      targetType: 'ExpertAvailabilityOverride',
      targetId: id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { localDate: override.localDate },
    });

    return { removed: true };
  }

  @Get('slots/preview')
  @ApiOperation({
    summary: 'Preview bookable slots computed from weekly windows and overrides',
    description:
      'Computes concrete slot instances (DST-safe, timezone-aware) from the recurring weekly ' +
      'availability and per-date overrides. Does not check existing bookings.',
  })
  @ApiResponse({ status: 200, description: 'Computed slot preview' })
  async previewSlots(
    @Req() req: AuthenticatedRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('durationMinutes') durationMinutes?: string,
  ) {
    const parsed = expertAvailabilitySlotPreviewQuerySchema.safeParse({
      from,
      to,
      durationMinutes,
    });
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'EXPERT_AVAILABILITY_VALIDATION_FAILED',
        details: parsed.error.issues.map((i: { path: (string | number)[]; message: string }) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    const userId = req.principal.userId;
    return this.slotService.previewSlots(userId, parsed.data);
  }
}

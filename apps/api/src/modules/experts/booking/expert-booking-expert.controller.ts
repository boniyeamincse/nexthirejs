import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../modules/auth/auth.guard';
import type { AuthenticatedRequest } from '../../../modules/auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { ExpertEligibilityGuard } from '../shared/expert-eligibility.guard';
import { ExpertBookingService } from './expert-booking.service';
import { updateExpertBookingByExpertSchema } from '@nexthire/validation';
import { EXPERT_BOOKING_ERROR_CODES, EXPERT_OFFERING_RATE_LIMITS } from '@nexthire/constants';

const HOUR_MS = 3_600_000;

@ApiTags('Expert Bookings')
@ApiBearerAuth('access-token')
@Controller('expert/bookings')
@UseGuards(AuthGuard, RolesGuard, ExpertEligibilityGuard)
@RequireRoles('expert')
export class ExpertBookingExpertController {
  constructor(private readonly bookingService: ExpertBookingService) {}

  @Get()
  @ApiOperation({ summary: 'List bookings received as an expert' })
  @ApiResponse({ status: 200, description: 'List of bookings' })
  async list(@Req() req: AuthenticatedRequest, @Query('status') status?: string) {
    return this.bookingService.listForExpert(req.principal.userId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one booking received as an expert' })
  @ApiResponse({ status: 200, description: 'Booking detail' })
  async get(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.bookingService.getForExpert(req.principal.userId, id);
  }

  @Patch(':id')
  @Throttle({
    default: { limit: EXPERT_OFFERING_RATE_LIMITS.BOOKING_ACTION_PER_HOUR, ttl: HOUR_MS },
  })
  @ApiOperation({ summary: 'Update meeting details, or complete/cancel a booking' })
  @ApiResponse({ status: 200, description: 'Booking updated' })
  async update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: unknown) {
    const parsed = updateExpertBookingByExpertSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: EXPERT_BOOKING_ERROR_CODES.VALIDATION_FAILED,
        details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    return this.bookingService.updateForExpert(req.principal.userId, id, parsed.data);
  }
}

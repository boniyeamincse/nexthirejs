import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
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
import { ExpertBookingService } from './expert-booking.service';
import { createExpertBookingSchema } from '@nexthire/validation';
import { EXPERT_BOOKING_ERROR_CODES, EXPERT_OFFERING_RATE_LIMITS } from '@nexthire/constants';

const HOUR_MS = 3_600_000;

@ApiTags('Expert Bookings (Candidate)')
@ApiBearerAuth('access-token')
@Controller({ path: 'candidates/me/bookings', version: '1' })
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
export class ExpertBookingCandidateController {
  constructor(private readonly bookingService: ExpertBookingService) {}

  @Get()
  @ApiOperation({ summary: 'List my expert bookings' })
  @ApiResponse({ status: 200, description: 'List of bookings' })
  async list(@Req() req: AuthenticatedRequest, @Query('status') status?: string) {
    return this.bookingService.listForCandidate(req.principal.userId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one of my expert bookings' })
  @ApiResponse({ status: 200, description: 'Booking detail' })
  async get(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.bookingService.getForCandidate(req.principal.userId, id);
  }

  @Post()
  @Throttle({
    default: { limit: EXPERT_OFFERING_RATE_LIMITS.BOOKING_CREATE_PER_HOUR, ttl: HOUR_MS },
  })
  @ApiOperation({ summary: 'Reserve (hold) a bookable expert slot' })
  @ApiResponse({ status: 201, description: 'Booking held' })
  async create(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parsed = createExpertBookingSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: EXPERT_BOOKING_ERROR_CODES.VALIDATION_FAILED,
        details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    return this.bookingService.createForCandidate(req.principal.userId, parsed.data);
  }

  @Post(':id/confirm')
  @Throttle({
    default: { limit: EXPERT_OFFERING_RATE_LIMITS.BOOKING_ACTION_PER_HOUR, ttl: HOUR_MS },
  })
  @ApiOperation({ summary: 'Confirm a held booking before its hold expires' })
  @ApiResponse({ status: 200, description: 'Booking confirmed' })
  async confirm(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.bookingService.confirmForCandidate(req.principal.userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel one of my expert bookings' })
  @ApiResponse({ status: 200, description: 'Booking cancelled' })
  async cancel(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.bookingService.cancelForCandidate(req.principal.userId, id);
  }
}

import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { BookingService } from './booking.service';
import type { CreateBookingDto, UpdateBookingDto } from './booking.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';

@ApiTags('Trainer Marketplace')
@Controller('bookings')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @ApiOperation({ summary: 'Create booking' })
  @ApiResponse({ status: 201, description: 'Booking created' })
  async createBooking(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Body() dto: CreateBookingDto,
  ): Promise<any> {
    return this.bookingService.createBooking(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List bookings for user' })
  @ApiResponse({ status: 200, description: 'Bookings retrieved' })
  async listBookings(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Query('role') role: 'candidate' | 'trainer' = 'candidate',
  ): Promise<any[]> {
    return this.bookingService.listBookings(user.userId, role);
  }

  @Get(':bookingId')
  @ApiOperation({ summary: 'Get booking details' })
  @ApiResponse({ status: 200, description: 'Booking retrieved' })
  async getBooking(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('bookingId') bookingId: string,
  ): Promise<any> {
    return this.bookingService.getBooking(bookingId, user.userId);
  }

  @Put(':bookingId')
  @ApiOperation({ summary: 'Update booking' })
  @ApiResponse({ status: 200, description: 'Booking updated' })
  async updateBooking(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('bookingId') bookingId: string,
    @Body() dto: UpdateBookingDto,
  ): Promise<any> {
    return this.bookingService.updateBooking(bookingId, user.userId, dto);
  }

  @Delete(':bookingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel booking' })
  @ApiResponse({ status: 204, description: 'Booking cancelled' })
  async cancelBooking(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('bookingId') bookingId: string,
  ): Promise<void> {
    return this.bookingService.cancelBooking(bookingId, user.userId);
  }
}

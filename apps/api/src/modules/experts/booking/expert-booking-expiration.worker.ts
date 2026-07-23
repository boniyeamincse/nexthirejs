import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ExpertBookingService } from './expert-booking.service';
import { EXPERT_BOOKING_HOLD_QUEUE } from '../../../infrastructure/queue/queue.constants';

@Processor(EXPERT_BOOKING_HOLD_QUEUE)
export class ExpertBookingExpirationWorker extends WorkerHost {
  private readonly logger = new Logger(ExpertBookingExpirationWorker.name);

  constructor(private readonly bookingService: ExpertBookingService) {
    super();
  }

  async process(job: Job<{ bookingId: string }>): Promise<void> {
    const { bookingId } = job.data;
    try {
      await this.bookingService.expireHoldIfDue(bookingId);
    } catch (error) {
      this.logger.error(`Failed to expire hold for booking ${bookingId}`, error);
      throw error;
    }
  }
}

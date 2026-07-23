import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExpertReviewService } from './expert-review.service';

describe('ExpertReviewService', () => {
  let service: ExpertReviewService;

  const prisma = {
    expertBooking: { findUnique: jest.fn() },
    expertReview: {
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      update: jest.fn(),
    },
  };
  const auditService = { recordBestEffort: jest.fn().mockResolvedValue(undefined) };

  const COMPLETED_BOOKING = {
    id: 'booking-1',
    expertUserId: 'expert-1',
    candidateId: 'candidate-1',
    status: 'COMPLETED',
  };

  const REVIEW_ROW = {
    id: 'review-1',
    bookingId: 'booking-1',
    expertUserId: 'expert-1',
    candidateId: 'candidate-1',
    rating: 5,
    comment: 'Great session',
    isHidden: false,
    hiddenReason: null,
    submittedAt: new Date('2026-08-05T10:00:00.000Z'),
    createdAt: new Date('2026-08-05T10:00:00.000Z'),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    auditService.recordBestEffort.mockResolvedValue(undefined);
    service = new ExpertReviewService(prisma as never, auditService as never);
  });

  describe('createForCandidate', () => {
    it('404s when the booking does not belong to this candidate', async () => {
      prisma.expertBooking.findUnique.mockResolvedValue({
        ...COMPLETED_BOOKING,
        candidateId: 'someone-else',
      });
      await expect(
        service.createForCandidate('candidate-1', 'booking-1', { rating: 5 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects reviewing a booking that is not COMPLETED', async () => {
      prisma.expertBooking.findUnique.mockResolvedValue({
        ...COMPLETED_BOOKING,
        status: 'CONFIRMED',
      });
      await expect(
        service.createForCandidate('candidate-1', 'booking-1', { rating: 5 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a second review for the same booking', async () => {
      prisma.expertBooking.findUnique.mockResolvedValue(COMPLETED_BOOKING);
      prisma.expertReview.findUnique.mockResolvedValue(REVIEW_ROW);
      await expect(
        service.createForCandidate('candidate-1', 'booking-1', { rating: 5 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates the review sourcing expertUserId from the booking', async () => {
      prisma.expertBooking.findUnique.mockResolvedValue(COMPLETED_BOOKING);
      prisma.expertReview.findUnique.mockResolvedValue(null);
      prisma.expertReview.create.mockResolvedValue(REVIEW_ROW);

      const result = await service.createForCandidate('candidate-1', 'booking-1', {
        rating: 5,
        comment: 'Great session',
      });

      expect(prisma.expertReview.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bookingId: 'booking-1',
            expertUserId: 'expert-1',
            candidateId: 'candidate-1',
            rating: 5,
          }),
        }),
      );
      expect(result.id).toBe('review-1');
    });
  });

  describe('getForCandidate / getForExpert', () => {
    it('404s for the wrong candidate', async () => {
      prisma.expertBooking.findUnique.mockResolvedValue({ candidateId: 'someone-else' });
      await expect(service.getForCandidate('candidate-1', 'booking-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('404s for the wrong expert', async () => {
      prisma.expertBooking.findUnique.mockResolvedValue({ expertUserId: 'someone-else' });
      await expect(service.getForExpert('expert-1', 'booking-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns null when nothing has been submitted', async () => {
      prisma.expertBooking.findUnique.mockResolvedValue({ candidateId: 'candidate-1' });
      prisma.expertReview.findUnique.mockResolvedValue(null);
      expect(await service.getForCandidate('candidate-1', 'booking-1')).toBeNull();
    });
  });

  describe('getAggregateForExpert', () => {
    it('rounds the average to one decimal place', async () => {
      prisma.expertReview.aggregate.mockResolvedValue({
        _avg: { rating: 4.333 },
        _count: { rating: 3 },
      });
      const result = await service.getAggregateForExpert('expert-1');
      expect(result).toEqual({ average: 4.3, count: 3 });
    });

    it('returns a null average when there are no reviews', async () => {
      prisma.expertReview.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: { rating: 0 },
      });
      const result = await service.getAggregateForExpert('expert-1');
      expect(result).toEqual({ average: null, count: 0 });
    });

    it('only counts non-hidden reviews', async () => {
      prisma.expertReview.aggregate.mockResolvedValue({
        _avg: { rating: 5 },
        _count: { rating: 1 },
      });
      await service.getAggregateForExpert('expert-1');
      expect(prisma.expertReview.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { expertUserId: 'expert-1', isHidden: false } }),
      );
    });
  });

  describe('getAggregatesForExperts', () => {
    it('returns an empty map for an empty input without querying', async () => {
      const result = await service.getAggregatesForExperts([]);
      expect(result.size).toBe(0);
      expect(prisma.expertReview.groupBy).not.toHaveBeenCalled();
    });

    it('builds a map keyed by expertUserId', async () => {
      prisma.expertReview.groupBy.mockResolvedValue([
        { expertUserId: 'expert-1', _avg: { rating: 4.5 }, _count: { rating: 2 } },
      ]);
      const result = await service.getAggregatesForExperts(['expert-1', 'expert-2']);
      expect(result.get('expert-1')).toEqual({ average: 4.5, count: 2 });
      expect(result.get('expert-2')).toBeUndefined();
    });
  });

  describe('hideReview / unhideReview', () => {
    it('404s when the review does not exist', async () => {
      prisma.expertReview.findUnique.mockResolvedValue(null);
      await expect(service.hideReview('review-1', 'admin-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('hides a review with a reason', async () => {
      prisma.expertReview.findUnique.mockResolvedValue(REVIEW_ROW);
      prisma.expertReview.update.mockResolvedValue({
        ...REVIEW_ROW,
        isHidden: true,
        hiddenReason: 'spam',
      });
      const result = await service.hideReview('review-1', 'admin-1', 'spam');
      expect(prisma.expertReview.update).toHaveBeenCalledWith({
        where: { id: 'review-1' },
        data: expect.objectContaining({ isHidden: true, hiddenReason: 'spam' }),
      });
      expect(result.isHidden).toBe(true);
    });

    it('unhides a review', async () => {
      prisma.expertReview.findUnique.mockResolvedValue({ ...REVIEW_ROW, isHidden: true });
      prisma.expertReview.update.mockResolvedValue(REVIEW_ROW);
      const result = await service.unhideReview('review-1', 'admin-1');
      expect(prisma.expertReview.update).toHaveBeenCalledWith({
        where: { id: 'review-1' },
        data: { isHidden: false, hiddenAt: null, hiddenReason: null },
      });
      expect(result.isHidden).toBe(false);
    });
  });
});

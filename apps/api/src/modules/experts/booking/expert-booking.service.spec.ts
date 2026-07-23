import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ExpertBookingService } from './expert-booking.service';

describe('ExpertBookingService', () => {
  let service: ExpertBookingService;

  const prisma = {
    expertService: { findUnique: jest.fn() },
    expertProfile: { findUnique: jest.fn() },
    expertBooking: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };
  const auditService = { recordBestEffort: jest.fn().mockResolvedValue(undefined) };
  const slotService = { previewSlots: jest.fn() };
  const holdQueue = { add: jest.fn(), getJob: jest.fn() };

  const ACTIVE_SERVICE = {
    id: 'service-1',
    userId: 'expert-1',
    status: 'ACTIVE',
    durationMinutes: 30,
    title: 'Mock Interview',
    type: 'MOCK_INTERVIEW',
    priceAmount: { toString: () => '50.00' },
    priceCurrency: 'USD',
  };

  const CANDIDATE_ROW = {
    id: 'booking-1',
    expertUserId: 'expert-1',
    expertServiceId: 'service-1',
    candidateId: 'candidate-1',
    status: 'HELD',
    slotStartUtc: new Date('2026-08-01T09:00:00.000Z'),
    slotEndUtc: new Date('2026-08-01T09:30:00.000Z'),
    holdExpiresAt: new Date('2026-08-01T08:15:00.000Z'),
    meetingUrl: null,
    notes: null,
    cancelledAt: null,
    completedAt: null,
    createdAt: new Date('2026-08-01T08:00:00.000Z'),
    updatedAt: new Date('2026-08-01T08:00:00.000Z'),
    expertService: ACTIVE_SERVICE,
    expertUser: {
      id: 'expert-1',
      email: 'expert@example.com',
      candidateProfile: { fullName: 'Expert Name' },
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-08-01T00:00:00.000Z'));
    auditService.recordBestEffort.mockResolvedValue(undefined);
    service = new ExpertBookingService(
      prisma as never,
      auditService as never,
      slotService as never,
      holdQueue as never,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('createForCandidate', () => {
    it('rejects when the service does not exist', async () => {
      prisma.expertService.findUnique.mockResolvedValue(null);
      await expect(
        service.createForCandidate('candidate-1', {
          expertServiceId: 'nope',
          slotStartUtc: '2026-08-01T09:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when the service is not ACTIVE', async () => {
      prisma.expertService.findUnique.mockResolvedValue({ ...ACTIVE_SERVICE, status: 'DRAFT' });
      await expect(
        service.createForCandidate('candidate-1', {
          expertServiceId: 'service-1',
          slotStartUtc: '2026-08-01T09:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects booking your own service', async () => {
      prisma.expertService.findUnique.mockResolvedValue(ACTIVE_SERVICE);
      await expect(
        service.createForCandidate('expert-1', {
          expertServiceId: 'service-1',
          slotStartUtc: '2026-08-01T09:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when the expert profile is not public', async () => {
      prisma.expertService.findUnique.mockResolvedValue(ACTIVE_SERVICE);
      prisma.expertProfile.findUnique.mockResolvedValue({ isPublic: false });
      await expect(
        service.createForCandidate('candidate-1', {
          expertServiceId: 'service-1',
          slotStartUtc: '2026-08-01T09:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a slot that is not currently offered', async () => {
      prisma.expertService.findUnique.mockResolvedValue(ACTIVE_SERVICE);
      prisma.expertProfile.findUnique.mockResolvedValue({ isPublic: true });
      slotService.previewSlots.mockResolvedValue({
        timezone: 'UTC',
        durationMinutes: 30,
        slots: [],
      });
      await expect(
        service.createForCandidate('candidate-1', {
          expertServiceId: 'service-1',
          slotStartUtc: '2026-08-01T09:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates a HELD booking, enqueues the hold-expiry job, and returns the mapped result', async () => {
      prisma.expertService.findUnique.mockResolvedValue(ACTIVE_SERVICE);
      prisma.expertProfile.findUnique.mockResolvedValue({ isPublic: true });
      slotService.previewSlots.mockResolvedValue({
        timezone: 'UTC',
        durationMinutes: 30,
        slots: [
          {
            startUtc: '2026-08-01T09:00:00.000Z',
            endUtc: '2026-08-01T09:30:00.000Z',
            localDate: '2026-08-01',
            startLocalTime: '09:00',
            endLocalTime: '09:30',
          },
        ],
      });
      prisma.expertBooking.create.mockResolvedValue({ id: 'booking-1' });
      prisma.expertBooking.findUnique.mockResolvedValue(CANDIDATE_ROW);

      const result = await service.createForCandidate('candidate-1', {
        expertServiceId: 'service-1',
        slotStartUtc: '2026-08-01T09:00:00.000Z',
      });

      expect(prisma.expertBooking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            expertUserId: 'expert-1',
            expertServiceId: 'service-1',
            candidateId: 'candidate-1',
            status: 'HELD',
          }),
        }),
      );
      expect(holdQueue.add).toHaveBeenCalledWith(
        expect.any(String),
        { bookingId: 'booking-1' },
        expect.objectContaining({ jobId: 'booking-1' }),
      );
      expect(result.id).toBe('booking-1');
      expect(result.status).toBe('HELD');
      expect(result.counterparty).toEqual({ id: 'expert-1', displayName: 'Expert Name' });
    });

    it('translates a unique-constraint race into a 409 conflict', async () => {
      prisma.expertService.findUnique.mockResolvedValue(ACTIVE_SERVICE);
      prisma.expertProfile.findUnique.mockResolvedValue({ isPublic: true });
      slotService.previewSlots.mockResolvedValue({
        timezone: 'UTC',
        durationMinutes: 30,
        slots: [
          {
            startUtc: '2026-08-01T09:00:00.000Z',
            endUtc: '2026-08-01T09:30:00.000Z',
            localDate: '2026-08-01',
            startLocalTime: '09:00',
            endLocalTime: '09:30',
          },
        ],
      });
      prisma.expertBooking.create.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.createForCandidate('candidate-1', {
          expertServiceId: 'service-1',
          slotStartUtc: '2026-08-01T09:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('confirmForCandidate', () => {
    it('404s when the booking does not belong to this candidate', async () => {
      prisma.expertBooking.findUnique.mockResolvedValue({
        ...CANDIDATE_ROW,
        candidateId: 'someone-else',
      });
      await expect(service.confirmForCandidate('candidate-1', 'booking-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects confirming a booking that is not HELD', async () => {
      prisma.expertBooking.findUnique.mockResolvedValue({ ...CANDIDATE_ROW, status: 'CONFIRMED' });
      await expect(service.confirmForCandidate('candidate-1', 'booking-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects confirming after the hold has expired', async () => {
      prisma.expertBooking.findUnique.mockResolvedValue({
        ...CANDIDATE_ROW,
        holdExpiresAt: new Date('2026-07-31T00:00:00.000Z'),
      });
      await expect(service.confirmForCandidate('candidate-1', 'booking-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('confirms a valid HELD booking and clears the hold-expiry job', async () => {
      prisma.expertBooking.findUnique
        .mockResolvedValueOnce({
          ...CANDIDATE_ROW,
          holdExpiresAt: new Date('2026-08-02T00:00:00.000Z'),
        })
        .mockResolvedValueOnce({ ...CANDIDATE_ROW, status: 'CONFIRMED', holdExpiresAt: null });
      holdQueue.getJob.mockResolvedValue({ remove: jest.fn().mockResolvedValue(undefined) });

      const result = await service.confirmForCandidate('candidate-1', 'booking-1');

      expect(prisma.expertBooking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: { status: 'CONFIRMED', holdExpiresAt: null },
      });
      expect(result.status).toBe('CONFIRMED');
    });
  });

  describe('cancelForCandidate', () => {
    it('404s for someone else’s booking', async () => {
      prisma.expertBooking.findUnique.mockResolvedValue({
        ...CANDIDATE_ROW,
        candidateId: 'someone-else',
      });
      await expect(service.cancelForCandidate('candidate-1', 'booking-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects cancelling an already-completed booking', async () => {
      prisma.expertBooking.findUnique.mockResolvedValue({ ...CANDIDATE_ROW, status: 'COMPLETED' });
      await expect(service.cancelForCandidate('candidate-1', 'booking-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('cancels a HELD booking', async () => {
      prisma.expertBooking.findUnique
        .mockResolvedValueOnce(CANDIDATE_ROW)
        .mockResolvedValueOnce({ ...CANDIDATE_ROW, status: 'CANCELLED' });
      const result = await service.cancelForCandidate('candidate-1', 'booking-1');
      expect(prisma.expertBooking.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'CANCELLED' }) }),
      );
      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('updateForExpert', () => {
    const EXPERT_ROW = {
      ...CANDIDATE_ROW,
      status: 'CONFIRMED',
      candidate: { id: 'candidate-1', email: 'candidate@example.com', candidateProfile: null },
    };

    it('404s when the booking does not belong to this expert', async () => {
      prisma.expertBooking.findUnique.mockResolvedValue({
        ...EXPERT_ROW,
        expertUserId: 'someone-else',
      });
      await expect(
        service.updateForExpert('expert-1', 'booking-1', { action: 'cancel' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects completing a booking before its scheduled end time', async () => {
      prisma.expertBooking.findUnique.mockResolvedValue({
        ...EXPERT_ROW,
        slotEndUtc: new Date('2026-08-05T00:00:00.000Z'),
      });
      await expect(
        service.updateForExpert('expert-1', 'booking-1', { action: 'complete' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects completing a booking that is not CONFIRMED', async () => {
      prisma.expertBooking.findUnique.mockResolvedValue({ ...EXPERT_ROW, status: 'HELD' });
      await expect(
        service.updateForExpert('expert-1', 'booking-1', { action: 'complete' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('completes a past-end-time CONFIRMED booking', async () => {
      prisma.expertBooking.findUnique
        .mockResolvedValueOnce({ ...EXPERT_ROW, slotEndUtc: new Date('2026-07-31T00:00:00.000Z') })
        .mockResolvedValueOnce({ ...EXPERT_ROW, status: 'COMPLETED' });
      const result = await service.updateForExpert('expert-1', 'booking-1', { action: 'complete' });
      expect(prisma.expertBooking.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'COMPLETED' }) }),
      );
      expect(result.status).toBe('COMPLETED');
    });

    it('updates meetingUrl/notes without changing status', async () => {
      prisma.expertBooking.findUnique
        .mockResolvedValueOnce(EXPERT_ROW)
        .mockResolvedValueOnce({ ...EXPERT_ROW, meetingUrl: 'https://meet.example.com/x' });
      await service.updateForExpert('expert-1', 'booking-1', {
        meetingUrl: 'https://meet.example.com/x',
      });
      expect(prisma.expertBooking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: { meetingUrl: 'https://meet.example.com/x' },
      });
    });
  });

  describe('expireHoldIfDue', () => {
    it('no-ops when the booking no longer exists', async () => {
      prisma.expertBooking.findUnique.mockResolvedValue(null);
      await service.expireHoldIfDue('booking-1');
      expect(prisma.expertBooking.update).not.toHaveBeenCalled();
    });

    it('no-ops when the booking is no longer HELD (already confirmed/cancelled)', async () => {
      prisma.expertBooking.findUnique.mockResolvedValue({ ...CANDIDATE_ROW, status: 'CONFIRMED' });
      await service.expireHoldIfDue('booking-1');
      expect(prisma.expertBooking.update).not.toHaveBeenCalled();
    });

    it('no-ops when the hold has not actually expired yet', async () => {
      prisma.expertBooking.findUnique.mockResolvedValue({
        ...CANDIDATE_ROW,
        holdExpiresAt: new Date('2026-08-02T00:00:00.000Z'),
      });
      await service.expireHoldIfDue('booking-1');
      expect(prisma.expertBooking.update).not.toHaveBeenCalled();
    });

    it('expires a HELD booking past its hold window', async () => {
      prisma.expertBooking.findUnique.mockResolvedValue({
        ...CANDIDATE_ROW,
        holdExpiresAt: new Date('2026-07-31T00:00:00.000Z'),
      });
      await service.expireHoldIfDue('booking-1');
      expect(prisma.expertBooking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: { status: 'EXPIRED' },
      });
    });
  });
});

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExpertSessionEvaluationService } from './expert-session-evaluation.service';

describe('ExpertSessionEvaluationService', () => {
  let service: ExpertSessionEvaluationService;

  const prisma = {
    expertBooking: { findUnique: jest.fn() },
    expertSessionEvaluation: { findUnique: jest.fn(), create: jest.fn() },
  };
  const auditService = { recordBestEffort: jest.fn().mockResolvedValue(undefined) };

  const COMPLETED_BOOKING = {
    id: 'booking-1',
    expertUserId: 'expert-1',
    candidateId: 'candidate-1',
    status: 'COMPLETED',
  };

  const EVALUATION_ROW = {
    id: 'eval-1',
    bookingId: 'booking-1',
    expertUserId: 'expert-1',
    candidateId: 'candidate-1',
    communication: 4,
    technicalKnowledge: 3,
    confidence: 5,
    problemSolving: 4,
    overallScore: 4,
    strengths: 'Good structure',
    improvements: 'Speak slower',
    nextSteps: 'Practice system design',
    submittedAt: new Date('2026-08-05T10:00:00.000Z'),
    createdAt: new Date('2026-08-05T10:00:00.000Z'),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    auditService.recordBestEffort.mockResolvedValue(undefined);
    service = new ExpertSessionEvaluationService(prisma as never, auditService as never);
  });

  describe('createForExpert', () => {
    it('404s when the booking does not belong to this expert', async () => {
      prisma.expertBooking.findUnique.mockResolvedValue({
        ...COMPLETED_BOOKING,
        expertUserId: 'someone-else',
      });
      await expect(
        service.createForExpert('expert-1', 'booking-1', {
          communication: 4,
          technicalKnowledge: 4,
          confidence: 4,
          problemSolving: 4,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects evaluating a booking that is not COMPLETED', async () => {
      prisma.expertBooking.findUnique.mockResolvedValue({
        ...COMPLETED_BOOKING,
        status: 'CONFIRMED',
      });
      await expect(
        service.createForExpert('expert-1', 'booking-1', {
          communication: 4,
          technicalKnowledge: 4,
          confidence: 4,
          problemSolving: 4,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a second evaluation for the same booking', async () => {
      prisma.expertBooking.findUnique.mockResolvedValue(COMPLETED_BOOKING);
      prisma.expertSessionEvaluation.findUnique.mockResolvedValue(EVALUATION_ROW);
      await expect(
        service.createForExpert('expert-1', 'booking-1', {
          communication: 4,
          technicalKnowledge: 4,
          confidence: 4,
          problemSolving: 4,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('computes the rounded overall score and creates the evaluation', async () => {
      prisma.expertBooking.findUnique.mockResolvedValue(COMPLETED_BOOKING);
      prisma.expertSessionEvaluation.findUnique.mockResolvedValue(null);
      prisma.expertSessionEvaluation.create.mockResolvedValue(EVALUATION_ROW);

      const result = await service.createForExpert('expert-1', 'booking-1', {
        communication: 4,
        technicalKnowledge: 3,
        confidence: 5,
        problemSolving: 4,
      });

      expect(prisma.expertSessionEvaluation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bookingId: 'booking-1',
            expertUserId: 'expert-1',
            candidateId: 'candidate-1',
            overallScore: 4,
          }),
        }),
      );
      expect(result.overallScore).toBe(4);
    });
  });

  describe('getForCandidate', () => {
    it('404s when the booking does not belong to this candidate', async () => {
      prisma.expertBooking.findUnique.mockResolvedValue({ candidateId: 'someone-else' });
      await expect(service.getForCandidate('candidate-1', 'booking-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns null when no evaluation has been submitted yet', async () => {
      prisma.expertBooking.findUnique.mockResolvedValue({ candidateId: 'candidate-1' });
      prisma.expertSessionEvaluation.findUnique.mockResolvedValue(null);
      const result = await service.getForCandidate('candidate-1', 'booking-1');
      expect(result).toBeNull();
    });

    it('returns the mapped evaluation when one exists', async () => {
      prisma.expertBooking.findUnique.mockResolvedValue({ candidateId: 'candidate-1' });
      prisma.expertSessionEvaluation.findUnique.mockResolvedValue(EVALUATION_ROW);
      const result = await service.getForCandidate('candidate-1', 'booking-1');
      expect(result?.id).toBe('eval-1');
    });
  });

  describe('getForExpert', () => {
    it('404s when the booking does not belong to this expert', async () => {
      prisma.expertBooking.findUnique.mockResolvedValue({ expertUserId: 'someone-else' });
      await expect(service.getForExpert('expert-1', 'booking-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns the mapped evaluation when one exists', async () => {
      prisma.expertBooking.findUnique.mockResolvedValue({ expertUserId: 'expert-1' });
      prisma.expertSessionEvaluation.findUnique.mockResolvedValue(EVALUATION_ROW);
      const result = await service.getForExpert('expert-1', 'booking-1');
      expect(result?.id).toBe('eval-1');
    });
  });
});

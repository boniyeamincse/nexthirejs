import { ExpertDashboardService } from './expert-dashboard.service';

describe('ExpertDashboardService', () => {
  let service: ExpertDashboardService;

  const prisma = {
    expertBooking: { count: jest.fn(), findMany: jest.fn() },
    expertService: { count: jest.fn() },
    expertAvailabilityProfile: { findUnique: jest.fn() },
  };
  const reviewService = {
    getAggregateForExpert: jest.fn(),
    listForExpertOwner: jest.fn(),
  };
  const walletService = { getWallet: jest.fn() };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ExpertDashboardService(
      prisma as never,
      reviewService as never,
      walletService as never,
    );
  });

  it('aggregates stats, upcoming bookings, wallet, reviews, and availability status', async () => {
    prisma.expertBooking.count.mockResolvedValueOnce(2).mockResolvedValueOnce(7);
    prisma.expertService.count.mockResolvedValue(3);
    prisma.expertBooking.findMany.mockResolvedValue([
      {
        id: 'booking-1',
        slotStartUtc: new Date('2026-08-05T09:00:00.000Z'),
        expertService: { title: 'Mock Interview', durationMinutes: 30 },
        candidate: {
          email: 'candidate@example.com',
          candidateProfile: { fullName: 'Alex Candidate' },
        },
      },
    ]);
    prisma.expertAvailabilityProfile.findUnique.mockResolvedValue({ id: 'profile-1' });
    reviewService.getAggregateForExpert.mockResolvedValue({ average: 4.5, count: 8 });
    walletService.getWallet.mockResolvedValue({
      id: 'wallet-1',
      balance: '0.00',
      currency: 'USD',
      status: 'ACTIVE',
      totalEarnings: '0.00',
      totalPayouts: '0.00',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
      recentTransactions: [],
    });
    reviewService.listForExpertOwner.mockResolvedValue({
      data: [{ id: 'review-1' }],
      aggregate: { average: 4.5, count: 8 },
      pagination: { page: 1, pageSize: 3, total: 1, totalPages: 1 },
    });

    const result = await service.getDashboard('expert-1');

    expect(result.stats).toEqual({
      upcomingBookingsCount: 2,
      completedSessionsCount: 7,
      activeServicesCount: 3,
      rating: { average: 4.5, count: 8 },
    });
    expect(result.upcomingBookings).toEqual([
      {
        id: 'booking-1',
        serviceTitle: 'Mock Interview',
        candidateDisplayName: 'Alex Candidate',
        slotStartUtc: '2026-08-05T09:00:00.000Z',
        durationMinutes: 30,
      },
    ]);
    expect(result.wallet?.currency).toBe('USD');
    expect(result.recentReviews).toEqual([{ id: 'review-1' }]);
    expect(result.hasAvailabilityConfigured).toBe(true);
  });

  it('falls back to email when the candidate has no profile fullName', async () => {
    prisma.expertBooking.count.mockResolvedValue(0);
    prisma.expertService.count.mockResolvedValue(0);
    prisma.expertBooking.findMany.mockResolvedValue([
      {
        id: 'booking-1',
        slotStartUtc: new Date('2026-08-05T09:00:00.000Z'),
        expertService: { title: 'Mock Interview', durationMinutes: 30 },
        candidate: { email: 'candidate@example.com', candidateProfile: null },
      },
    ]);
    prisma.expertAvailabilityProfile.findUnique.mockResolvedValue(null);
    reviewService.getAggregateForExpert.mockResolvedValue({ average: null, count: 0 });
    walletService.getWallet.mockResolvedValue(null);
    reviewService.listForExpertOwner.mockResolvedValue({
      data: [],
      aggregate: { average: null, count: 0 },
      pagination: { page: 1, pageSize: 3, total: 0, totalPages: 1 },
    });

    const result = await service.getDashboard('expert-1');

    expect(result.upcomingBookings[0]?.candidateDisplayName).toBe('candidate@example.com');
    expect(result.wallet).toBeNull();
    expect(result.hasAvailabilityConfigured).toBe(false);
  });
});

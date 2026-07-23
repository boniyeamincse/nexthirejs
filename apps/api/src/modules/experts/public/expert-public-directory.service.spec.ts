import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExpertPublicDirectoryService } from './expert-public-directory.service';

describe('ExpertPublicDirectoryService', () => {
  let service: ExpertPublicDirectoryService;
  const repo = {
    listPublic: jest.fn(),
    findPublicBySlug: jest.fn(),
    findPublicServiceBySlug: jest.fn(),
    findPublicUserIdBySlug: jest.fn(),
  };
  const slotService = {
    previewSlots: jest.fn(),
  };
  const reviewService = {
    getAggregatesForExperts: jest.fn(),
    getAggregateForExpert: jest.fn(),
    listPublicForExpert: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    reviewService.getAggregatesForExperts.mockResolvedValue(new Map());
    reviewService.getAggregateForExpert.mockResolvedValue({ average: null, count: 0 });
    service = new ExpertPublicDirectoryService(
      repo as never,
      slotService as never,
      reviewService as never,
    );
  });

  describe('list', () => {
    it('maps rows into card projections with primary expertise', async () => {
      repo.listPublic.mockResolvedValue({
        total: 1,
        rows: [
          {
            id: 'user-1',
            expertProfile: {
              publicSlug: 'senior-backend-engineer-abc123ef',
              professionalTitle: 'Senior Backend Engineer',
              professionalSummary: 'Ten years of distributed systems.',
              yearsOfExperience: 10,
              currentCompany: 'Acme',
              currentPosition: 'Staff Engineer',
              countryId: 'c1',
              city: 'Remote',
              interviewLanguages: ['en'],
            },
            expertExpertise: [
              { expertiseArea: { name: 'Backend Development', slug: 'backend-development' } },
            ],
          },
        ],
      });

      const result = await service.list({ page: 1, pageSize: 20 });

      expect(result.pagination).toEqual({ page: 1, pageSize: 20, total: 1, totalPages: 1 });
      expect(result.data[0]).toEqual({
        publicSlug: 'senior-backend-engineer-abc123ef',
        professionalTitle: 'Senior Backend Engineer',
        professionalSummary: 'Ten years of distributed systems.',
        yearsOfExperience: 10,
        currentCompany: 'Acme',
        currentPosition: 'Staff Engineer',
        countryId: 'c1',
        city: 'Remote',
        interviewLanguages: ['en'],
        primaryExpertise: [{ areaName: 'Backend Development', areaSlug: 'backend-development' }],
        rating: { average: null, count: 0 },
      });
    });

    it('enriches each row with its aggregate rating', async () => {
      repo.listPublic.mockResolvedValue({
        total: 1,
        rows: [
          {
            id: 'user-1',
            expertProfile: {
              publicSlug: 'senior-backend-engineer-abc123ef',
              professionalTitle: 'Senior Backend Engineer',
              professionalSummary: 'Ten years of distributed systems.',
              yearsOfExperience: 10,
              currentCompany: 'Acme',
              currentPosition: 'Staff Engineer',
              countryId: 'c1',
              city: 'Remote',
              interviewLanguages: ['en'],
            },
            expertExpertise: [],
          },
        ],
      });
      reviewService.getAggregatesForExperts.mockResolvedValue(
        new Map([['user-1', { average: 4.5, count: 8 }]]),
      );

      const result = await service.list({ page: 1, pageSize: 20 });

      expect(reviewService.getAggregatesForExperts).toHaveBeenCalledWith(['user-1']);
      expect(result.data[0]?.rating).toEqual({ average: 4.5, count: 8 });
    });

    it('falls back to defaults for a garbage pageSize instead of rejecting', async () => {
      repo.listPublic.mockResolvedValue({ total: 0, rows: [] });
      await service.list({ pageSize: 'not-a-number-at-all' });
      expect(repo.listPublic).toHaveBeenCalledWith(expect.objectContaining({ pageSize: 20 }));
    });

    it('rejects a malformed expertiseAreaId', async () => {
      await expect(service.list({ expertiseAreaId: 'not-a-uuid' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('getBySlug', () => {
    it('returns a full projection including expertise and active services', async () => {
      repo.findPublicBySlug.mockResolvedValue({
        profile: {
          publicSlug: 'senior-backend-engineer-abc123ef',
          professionalTitle: 'Senior Backend Engineer',
          professionalSummary: 'Ten years of distributed systems.',
          yearsOfExperience: 10,
          currentCompany: 'Acme',
          currentPosition: 'Staff Engineer',
          highestEducation: 'MSc CS',
          linkedinUrl: null,
          portfolioUrl: null,
          personalWebsiteUrl: null,
          interviewLanguages: ['en'],
          countryId: 'c1',
          city: 'Remote',
        },
        user: {
          expertExpertise: [
            {
              expertiseArea: { name: 'Backend Development', slug: 'backend-development' },
              level: 'EXPERT',
              isPrimary: true,
            },
          ],
          expertServices: [
            {
              id: 's1',
              type: 'MOCK_INTERVIEW',
              title: 'Backend mock interview',
              shortDescription: 'A realistic backend system-design interview.',
              durationMinutes: 30,
              priceAmount: { toString: () => '50.00' },
              priceCurrency: 'USD',
            },
          ],
        },
      });

      const result = await service.getBySlug('senior-backend-engineer-abc123ef');

      expect(result.publicSlug).toBe('senior-backend-engineer-abc123ef');
      expect(result.expertise).toEqual([
        {
          areaName: 'Backend Development',
          areaSlug: 'backend-development',
          level: 'EXPERT',
          isPrimary: true,
        },
      ]);
      expect(result.services).toEqual([
        {
          id: 's1',
          type: 'MOCK_INTERVIEW',
          title: 'Backend mock interview',
          shortDescription: 'A realistic backend system-design interview.',
          durationMinutes: 30,
          price: { amount: '50.00', currency: 'USD' },
        },
      ]);
    });

    it('404s for a slug that does not exist', async () => {
      repo.findPublicBySlug.mockResolvedValue(null);
      await expect(service.getBySlug('nope')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('404s for a malformed slug without querying the repository', async () => {
      await expect(service.getBySlug('has spaces!!')).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.findPublicBySlug).not.toHaveBeenCalled();
    });

    it('includes the aggregate rating for the resolved expert', async () => {
      repo.findPublicBySlug.mockResolvedValue({
        profile: {
          userId: 'expert-1',
          publicSlug: 'senior-backend-engineer-abc123ef',
          professionalTitle: 'Senior Backend Engineer',
          professionalSummary: 'Ten years.',
          yearsOfExperience: 10,
          currentCompany: null,
          currentPosition: null,
          highestEducation: null,
          linkedinUrl: null,
          portfolioUrl: null,
          personalWebsiteUrl: null,
          interviewLanguages: [],
          countryId: 'c1',
          city: null,
        },
        user: { expertExpertise: [], expertServices: [] },
      });
      reviewService.getAggregateForExpert.mockResolvedValue({ average: 4.2, count: 5 });

      const result = await service.getBySlug('senior-backend-engineer-abc123ef');

      expect(reviewService.getAggregateForExpert).toHaveBeenCalledWith('expert-1');
      expect(result.rating).toEqual({ average: 4.2, count: 5 });
    });
  });

  describe('getReviews', () => {
    it('resolves the slug to an expert and lists their public reviews', async () => {
      repo.findPublicUserIdBySlug.mockResolvedValue('expert-1');
      reviewService.listPublicForExpert.mockResolvedValue({
        data: [],
        aggregate: { average: null, count: 0 },
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
      });

      await service.getReviews('senior-backend-engineer-abc123ef', { page: 1, pageSize: 20 });

      expect(repo.findPublicUserIdBySlug).toHaveBeenCalledWith('senior-backend-engineer-abc123ef');
      expect(reviewService.listPublicForExpert).toHaveBeenCalledWith('expert-1', {
        page: 1,
        pageSize: 20,
      });
    });

    it('404s when the slug does not resolve to a public expert', async () => {
      repo.findPublicUserIdBySlug.mockResolvedValue(null);
      await expect(service.getReviews('nope', {})).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getServiceSlots', () => {
    it('previews slots for the resolved expert using the service duration', async () => {
      repo.findPublicServiceBySlug.mockResolvedValue({
        expertUserId: 'expert-1',
        service: { durationMinutes: 30 },
      });
      slotService.previewSlots.mockResolvedValue({
        timezone: 'UTC',
        durationMinutes: 30,
        slots: [],
      });

      await service.getServiceSlots('senior-backend-engineer-abc123ef', 'service-1', {
        from: '2026-08-01',
        to: '2026-08-07',
      });

      expect(repo.findPublicServiceBySlug).toHaveBeenCalledWith(
        'senior-backend-engineer-abc123ef',
        'service-1',
      );
      expect(slotService.previewSlots).toHaveBeenCalledWith('expert-1', {
        from: '2026-08-01',
        to: '2026-08-07',
        durationMinutes: 30,
      });
    });

    it('404s when the service/slug combination does not resolve', async () => {
      repo.findPublicServiceBySlug.mockResolvedValue(null);
      await expect(
        service.getServiceSlots('some-slug', 'service-1', { from: '2026-08-01', to: '2026-08-07' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects a malformed date range without querying the repository', async () => {
      await expect(
        service.getServiceSlots('some-slug', 'service-1', { from: 'not-a-date', to: '2026-08-07' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.findPublicServiceBySlug).not.toHaveBeenCalled();
    });
  });
});

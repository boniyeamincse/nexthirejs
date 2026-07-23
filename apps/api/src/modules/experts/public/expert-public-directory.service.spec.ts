import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExpertPublicDirectoryService } from './expert-public-directory.service';

describe('ExpertPublicDirectoryService', () => {
  let service: ExpertPublicDirectoryService;
  const repo = {
    listPublic: jest.fn(),
    findPublicBySlug: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ExpertPublicDirectoryService(repo as never);
  });

  describe('list', () => {
    it('maps rows into card projections with primary expertise', async () => {
      repo.listPublic.mockResolvedValue({
        total: 1,
        rows: [
          {
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
      });
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
        { areaName: 'Backend Development', areaSlug: 'backend-development', level: 'EXPERT', isPrimary: true },
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
  });
});

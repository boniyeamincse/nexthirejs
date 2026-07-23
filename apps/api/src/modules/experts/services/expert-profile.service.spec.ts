import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExpertProfileService } from './expert-profile.service';

describe('ExpertProfileService', () => {
  let service: ExpertProfileService;
  const repo = {
    findByUserId: jest.fn(),
    countryExists: jest.fn(),
    upsert: jest.fn(),
    slugExists: jest.fn(),
    setVisibility: jest.fn(),
  };
  const audit = { recordRequired: jest.fn() };

  const validInput = {
    professionalTitle: 'Senior Engineer',
    professionalSummary:
      'A'.repeat(150) +
      ' seasoned professional with extensive interviewing experience across teams.',
    yearsOfExperience: 8,
    interviewLanguages: ['en'],
    countryId: '11111111-1111-1111-1111-111111111111',
  };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ExpertProfileService(repo as never, audit as never);
  });

  it('returns null profile when none exists', async () => {
    repo.findByUserId.mockResolvedValue(null);
    const result = await service.getProfile('u1');
    expect(result.profile).toBeNull();
  });

  it('rejects invalid payloads', async () => {
    await expect(service.upsertProfile('u1', { professionalTitle: 'x' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects a javascript: URL', async () => {
    await expect(
      service.upsertProfile('u1', { ...validInput, linkedinUrl: 'javascript:alert(1)' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an unknown country', async () => {
    repo.countryExists.mockResolvedValue(false);
    await expect(service.upsertProfile('u1', validInput)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('creates a new profile and audits creation', async () => {
    repo.countryExists.mockResolvedValue(true);
    repo.findByUserId.mockResolvedValue(null);
    repo.upsert.mockResolvedValue({
      id: 'p1',
      userId: 'u1',
      ...validInput,
      currentCompany: null,
      currentPosition: null,
      highestEducation: null,
      linkedinUrl: null,
      portfolioUrl: null,
      personalWebsiteUrl: null,
      city: null,
      profilePhotoFileId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.upsertProfile('u1', validInput);

    expect(result.id).toBe('p1');
    expect(audit.recordRequired).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'expert.profile.created' }),
    );
  });

  it('accepts a valid https URL and updates existing profile', async () => {
    repo.countryExists.mockResolvedValue(true);
    repo.findByUserId.mockResolvedValue({ id: 'p1', professionalTitle: 'Old' });
    repo.upsert.mockResolvedValue({
      id: 'p1',
      userId: 'u1',
      ...validInput,
      linkedinUrl: 'https://linkedin.com/in/x',
      currentCompany: null,
      currentPosition: null,
      highestEducation: null,
      portfolioUrl: null,
      personalWebsiteUrl: null,
      city: null,
      profilePhotoFileId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.upsertProfile('u1', {
      ...validInput,
      linkedinUrl: 'https://linkedin.com/in/x',
    });

    expect(result.linkedinUrl).toBe('https://linkedin.com/in/x');
    expect(audit.recordRequired).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'expert.profile.updated' }),
    );
  });

  describe('setPublicVisibility', () => {
    it('404s when no profile exists yet', async () => {
      repo.findByUserId.mockResolvedValue(null);
      await expect(
        service.setPublicVisibility('u1', { isPublic: true }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects a non-boolean isPublic', async () => {
      repo.findByUserId.mockResolvedValue({ id: 'p1', publicSlug: null });
      await expect(
        service.setPublicVisibility('u1', { isPublic: 'yes' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('generates a slug the first time a profile is made public', async () => {
      repo.findByUserId.mockResolvedValue({
        id: 'p1',
        professionalTitle: 'Senior Backend Engineer',
        publicSlug: null,
      });
      repo.slugExists.mockResolvedValue(false);
      repo.setVisibility.mockImplementation((_userId, data) =>
        Promise.resolve({ isPublic: data.isPublic, publicSlug: data.publicSlug }),
      );

      const result = await service.setPublicVisibility('u1', { isPublic: true });

      expect(result.isPublic).toBe(true);
      expect(result.publicSlug).toMatch(/^senior-backend-engineer-[0-9a-f]{8}$/);
      expect(audit.recordRequired).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'expert.profile.made_public' }),
      );
    });

    it('reuses the existing slug on subsequent toggles instead of generating a new one', async () => {
      repo.findByUserId.mockResolvedValue({
        id: 'p1',
        professionalTitle: 'Senior Backend Engineer',
        publicSlug: 'senior-backend-engineer-aaaaaaaa',
      });
      repo.setVisibility.mockImplementation((_userId, data) =>
        Promise.resolve({ isPublic: data.isPublic, publicSlug: data.publicSlug }),
      );

      const result = await service.setPublicVisibility('u1', { isPublic: false });

      expect(repo.slugExists).not.toHaveBeenCalled();
      expect(result).toEqual({ isPublic: false, publicSlug: 'senior-backend-engineer-aaaaaaaa' });
      expect(audit.recordRequired).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'expert.profile.made_private' }),
      );
    });
  });
});

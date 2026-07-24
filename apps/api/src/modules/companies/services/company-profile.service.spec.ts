import { BadRequestException } from '@nestjs/common';
import { CompanyProfileService } from './company-profile.service';

describe('CompanyProfileService', () => {
  let service: CompanyProfileService;
  const repo = {
    findByOwnerUserId: jest.fn(),
    countryExists: jest.fn(),
    upsert: jest.fn(),
  };
  const audit = { recordRequired: jest.fn() };

  const validInput = {
    name: 'Acme Corp',
    headquartersCountryId: '11111111-1111-1111-1111-111111111111',
    description: 'A'.repeat(60),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new CompanyProfileService(repo as never, audit as never);
  });

  it('returns null profile when none exists', async () => {
    repo.findByOwnerUserId.mockResolvedValue(null);
    const result = await service.getProfile('u1');
    expect(result.profile).toBeNull();
  });

  it('rejects invalid payloads', async () => {
    await expect(service.upsertProfile('u1', { name: 'x' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects an unknown country', async () => {
    repo.countryExists.mockResolvedValue(false);
    await expect(service.upsertProfile('u1', validInput)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('creates a new company and audits creation', async () => {
    repo.countryExists.mockResolvedValue(true);
    repo.findByOwnerUserId.mockResolvedValue(null);
    repo.upsert.mockResolvedValue({
      id: 'c1',
      ownerUserId: 'u1',
      ...validInput,
      legalName: null,
      website: null,
      industry: null,
      companySize: null,
      headquartersCity: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.upsertProfile('u1', validInput);

    expect(result.id).toBe('c1');
    expect(audit.recordRequired).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'company.profile.created' }),
    );
  });

  it('updates an existing company and audits the update', async () => {
    repo.countryExists.mockResolvedValue(true);
    repo.findByOwnerUserId.mockResolvedValue({ id: 'c1', name: 'Old' });
    repo.upsert.mockResolvedValue({
      id: 'c1',
      ownerUserId: 'u1',
      ...validInput,
      legalName: null,
      website: null,
      industry: null,
      companySize: null,
      headquartersCity: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await service.upsertProfile('u1', validInput);

    expect(audit.recordRequired).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'company.profile.updated' }),
    );
  });
});

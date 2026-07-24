import { CompanyApplicationReadinessService } from './company-application-readiness.service';

describe('CompanyApplicationReadinessService', () => {
  let service: CompanyApplicationReadinessService;
  const prisma = { userMfa: { findUnique: jest.fn() } };
  const companyRepository = { findByOwnerUserId: jest.fn() };
  const documentRepository = { listActive: jest.fn() };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new CompanyApplicationReadinessService(
      prisma as never,
      companyRepository as never,
      documentRepository as never,
    );
  });

  it('flags an incomplete profile, missing documents, and missing MFA all at once', async () => {
    companyRepository.findByOwnerUserId.mockResolvedValue(null);
    prisma.userMfa.findUnique.mockResolvedValue(null);

    const result = await service.evaluate({ ownerUserId: 'u1', applicationId: null });

    expect(result.ready).toBe(false);
    expect(result.blockers.map((b) => b.code)).toEqual(
      expect.arrayContaining(['PROFILE_INCOMPLETE', 'MISSING_BUSINESS_REGISTRATION', 'MFA_REQUIRED_BY_POLICY']),
    );
    expect(result.summary).toEqual({
      profileComplete: false,
      requiredDocumentsPresent: false,
      mfaEnabled: false,
      documentCount: 0,
    });
  });

  it('is ready when profile, business registration doc, and MFA are all present', async () => {
    companyRepository.findByOwnerUserId.mockResolvedValue({ id: 'c1' });
    documentRepository.listActive.mockResolvedValue([{ type: 'BUSINESS_REGISTRATION' }]);
    prisma.userMfa.findUnique.mockResolvedValue({ status: 'ENABLED' });

    const result = await service.evaluate({ ownerUserId: 'u1', applicationId: 'app-1' });

    expect(result.ready).toBe(true);
    expect(result.blockers).toEqual([]);
  });

  it('does not query documents when there is no active application yet', async () => {
    companyRepository.findByOwnerUserId.mockResolvedValue({ id: 'c1' });
    prisma.userMfa.findUnique.mockResolvedValue({ status: 'ENABLED' });

    await service.evaluate({ ownerUserId: 'u1', applicationId: null });

    expect(documentRepository.listActive).not.toHaveBeenCalled();
  });

  describe('isMfaEnabled', () => {
    it('returns true only when status is ENABLED', async () => {
      prisma.userMfa.findUnique.mockResolvedValue({ status: 'PENDING' });
      expect(await service.isMfaEnabled('u1')).toBe(false);

      prisma.userMfa.findUnique.mockResolvedValue({ status: 'ENABLED' });
      expect(await service.isMfaEnabled('u1')).toBe(true);
    });
  });
});

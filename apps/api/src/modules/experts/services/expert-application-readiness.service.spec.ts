import { ExpertApplicationReadinessService } from './expert-application-readiness.service';

describe('ExpertApplicationReadinessService', () => {
  let service: ExpertApplicationReadinessService;
  const prisma = { userMfa: { findUnique: jest.fn() } };
  const profileRepo = { findByUserId: jest.fn() };
  const documentRepo = { listActive: jest.fn() };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ExpertApplicationReadinessService(
      prisma as never,
      profileRepo as never,
      documentRepo as never,
    );
  });

  const enableMfa = () => prisma.userMfa.findUnique.mockResolvedValue({ status: 'ENABLED' });

  it('reports ready when profile, docs and MFA are all present', async () => {
    profileRepo.findByUserId.mockResolvedValue({ id: 'p1' });
    documentRepo.listActive.mockResolvedValue([
      { type: 'GOVERNMENT_ID' },
      { type: 'PROFESSIONAL_CERTIFICATE' },
    ]);
    enableMfa();

    const result = await service.evaluate({ userId: 'u1', applicationId: 'a1' });

    expect(result.ready).toBe(true);
    expect(result.blockers).toHaveLength(0);
    expect(result.summary).toEqual({
      profileComplete: true,
      requiredDocumentsPresent: true,
      mfaEnabled: true,
      documentCount: 2,
    });
  });

  it('blocks when profile missing', async () => {
    profileRepo.findByUserId.mockResolvedValue(null);
    documentRepo.listActive.mockResolvedValue([]);
    prisma.userMfa.findUnique.mockResolvedValue({ status: 'ENABLED' });

    const result = await service.evaluate({ userId: 'u1', applicationId: 'a1' });

    expect(result.ready).toBe(false);
    expect(result.blockers.map((b) => b.code)).toContain('PROFILE_INCOMPLETE');
  });

  it('blocks when identity or credential document missing', async () => {
    profileRepo.findByUserId.mockResolvedValue({ id: 'p1' });
    documentRepo.listActive.mockResolvedValue([{ type: 'GOVERNMENT_ID' }]);
    enableMfa();

    const result = await service.evaluate({ userId: 'u1', applicationId: 'a1' });

    const codes = result.blockers.map((b) => b.code);
    expect(codes).toContain('MISSING_CREDENTIAL_DOCUMENT');
    expect(codes).not.toContain('MISSING_IDENTITY_DOCUMENT');
    expect(result.summary.requiredDocumentsPresent).toBe(false);
  });

  it('blocks when MFA disabled', async () => {
    profileRepo.findByUserId.mockResolvedValue({ id: 'p1' });
    documentRepo.listActive.mockResolvedValue([
      { type: 'GOVERNMENT_ID' },
      { type: 'EDUCATION_CERTIFICATE' },
    ]);
    prisma.userMfa.findUnique.mockResolvedValue({ status: 'DISABLED' });

    const result = await service.evaluate({ userId: 'u1', applicationId: 'a1' });

    expect(result.ready).toBe(false);
    expect(result.blockers.map((b) => b.code)).toContain('MFA_REQUIRED_BY_POLICY');
  });

  it('treats no applicationId as zero documents', async () => {
    profileRepo.findByUserId.mockResolvedValue({ id: 'p1' });
    enableMfa();

    const result = await service.evaluate({ userId: 'u1', applicationId: null });

    expect(documentRepo.listActive).not.toHaveBeenCalled();
    expect(result.summary.documentCount).toBe(0);
  });

  it('isMfaEnabled returns false when no record', async () => {
    prisma.userMfa.findUnique.mockResolvedValue(null);
    expect(await service.isMfaEnabled('u1')).toBe(false);
  });
});

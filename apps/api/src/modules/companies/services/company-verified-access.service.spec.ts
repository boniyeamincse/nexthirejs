import { ForbiddenException } from '@nestjs/common';
import { CompanyVerifiedAccessService } from './company-verified-access.service';

describe('CompanyVerifiedAccessService', () => {
  let service: CompanyVerifiedAccessService;
  const memberRepository = { findByUserId: jest.fn() };
  const applicationRepository = { isApproved: jest.fn() };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new CompanyVerifiedAccessService(
      memberRepository as never,
      applicationRepository as never,
    );
  });

  it('rejects a non-member', async () => {
    memberRepository.findByUserId.mockResolvedValue(null);
    await expect(service.requireVerifiedMember('u1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a member of an unverified company', async () => {
    memberRepository.findByUserId.mockResolvedValue({ companyId: 'c1', role: 'OWNER' });
    applicationRepository.isApproved.mockResolvedValue(false);
    await expect(service.requireVerifiedMember('u1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows a member of a verified company', async () => {
    memberRepository.findByUserId.mockResolvedValue({ companyId: 'c1', role: 'VIEWER' });
    applicationRepository.isApproved.mockResolvedValue(true);
    await expect(service.requireVerifiedMember('u1')).resolves.toEqual({
      companyId: 'c1',
      role: 'VIEWER',
    });
  });
});

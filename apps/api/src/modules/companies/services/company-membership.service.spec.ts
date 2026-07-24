import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CompanyMembershipService } from './company-membership.service';

describe('CompanyMembershipService', () => {
  let service: CompanyMembershipService;
  const repo = {
    findByUserId: jest.fn(),
    findById: jest.fn(),
    findByIdWithUser: jest.fn(),
    listByCompany: jest.fn(),
    updateRole: jest.fn(),
    remove: jest.fn(),
  };
  const audit = { recordRequired: jest.fn() };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new CompanyMembershipService(repo as never, audit as never);
  });

  describe('getMyRole', () => {
    it('returns null when the user is not a member of any company', async () => {
      repo.findByUserId.mockResolvedValue(null);
      expect(await service.getMyRole('u1')).toEqual({ role: null });
    });

    it('returns the role when the user is a member', async () => {
      repo.findByUserId.mockResolvedValue({ role: 'ADMIN' });
      expect(await service.getMyRole('u1')).toEqual({ role: 'ADMIN' });
    });
  });

  describe('requireMembership / requireManager', () => {
    it('rejects a non-member', async () => {
      repo.findByUserId.mockResolvedValue(null);
      await expect(service.requireMembership('u1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects a RECRUITER trying to act as a manager', async () => {
      repo.findByUserId.mockResolvedValue({ role: 'RECRUITER', companyId: 'c1' });
      await expect(service.requireManager('u1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows an ADMIN to act as a manager', async () => {
      repo.findByUserId.mockResolvedValue({ role: 'ADMIN', companyId: 'c1' });
      await expect(service.requireManager('u1')).resolves.toEqual({
        role: 'ADMIN',
        companyId: 'c1',
      });
    });
  });

  describe('listMembers', () => {
    it('lists members mapped for the caller company', async () => {
      repo.findByUserId.mockResolvedValue({ role: 'VIEWER', companyId: 'c1' });
      repo.listByCompany.mockResolvedValue([
        {
          id: 'm1',
          userId: 'u1',
          role: 'OWNER',
          joinedAt: new Date('2026-01-01'),
          user: { email: 'owner@co.com', candidateProfile: { fullName: 'Owner Name' } },
        },
      ]);

      const result = await service.listMembers('u1');
      expect(repo.listByCompany).toHaveBeenCalledWith('c1');
      expect(result).toEqual([
        {
          id: 'm1',
          userId: 'u1',
          role: 'OWNER',
          displayName: 'Owner Name',
          email: 'owner@co.com',
          joinedAt: '2026-01-01T00:00:00.000Z',
        },
      ]);
    });
  });

  describe('updateMemberRole', () => {
    it('rejects when the target member is not found', async () => {
      repo.findByUserId.mockResolvedValue({ role: 'OWNER', companyId: 'c1' });
      repo.findById.mockResolvedValue(null);
      await expect(service.updateMemberRole('owner', 'm2', 'ADMIN')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects changing the OWNER role', async () => {
      repo.findByUserId.mockResolvedValue({ role: 'OWNER', companyId: 'c1' });
      repo.findById.mockResolvedValue({ id: 'm1', companyId: 'c1', role: 'OWNER', userId: 'u1' });
      await expect(service.updateMemberRole('owner', 'm1', 'ADMIN')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects an ADMIN managing another ADMIN', async () => {
      repo.findByUserId.mockResolvedValue({ role: 'ADMIN', companyId: 'c1' });
      repo.findById.mockResolvedValue({ id: 'm1', companyId: 'c1', role: 'ADMIN', userId: 'u2' });
      await expect(service.updateMemberRole('admin', 'm1', 'VIEWER')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('allows the OWNER to change an ADMIN role', async () => {
      repo.findByUserId.mockResolvedValue({ role: 'OWNER', companyId: 'c1' });
      repo.findById.mockResolvedValue({ id: 'm1', companyId: 'c1', role: 'ADMIN', userId: 'u2' });
      repo.updateRole.mockResolvedValue({ id: 'm1' });
      repo.findByIdWithUser.mockResolvedValue({
        id: 'm1',
        userId: 'u2',
        role: 'VIEWER',
        joinedAt: new Date('2026-01-01'),
        user: { email: 'a@co.com', candidateProfile: null },
      });

      const result = await service.updateMemberRole('owner', 'm1', 'VIEWER');
      expect(repo.updateRole).toHaveBeenCalledWith('m1', 'VIEWER');
      expect(result.role).toBe('VIEWER');
      expect(audit.recordRequired).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'company.member.role_updated' }),
      );
    });
  });

  describe('removeMember', () => {
    it('rejects removing the OWNER', async () => {
      repo.findByUserId.mockResolvedValue({ role: 'OWNER', companyId: 'c1' });
      repo.findById.mockResolvedValue({
        id: 'm1',
        companyId: 'c1',
        role: 'OWNER',
        userId: 'owner',
      });
      await expect(service.removeMember('owner', 'm1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('allows a VIEWER to remove themselves', async () => {
      repo.findByUserId.mockResolvedValue({ role: 'VIEWER', companyId: 'c1' });
      repo.findById.mockResolvedValue({ id: 'm1', companyId: 'c1', role: 'VIEWER', userId: 'u1' });

      await service.removeMember('u1', 'm1');
      expect(repo.remove).toHaveBeenCalledWith('m1');
      expect(audit.recordRequired).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'company.member.left' }),
      );
    });

    it('rejects a RECRUITER removing someone else', async () => {
      repo.findByUserId.mockResolvedValue({ role: 'RECRUITER', companyId: 'c1' });
      repo.findById.mockResolvedValue({ id: 'm2', companyId: 'c1', role: 'VIEWER', userId: 'u2' });
      await expect(service.removeMember('recruiter', 'm2')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('rejects an ADMIN removing another ADMIN', async () => {
      repo.findByUserId.mockResolvedValue({ role: 'ADMIN', companyId: 'c1' });
      repo.findById.mockResolvedValue({ id: 'm2', companyId: 'c1', role: 'ADMIN', userId: 'u2' });
      await expect(service.removeMember('admin', 'm2')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows the OWNER to remove a RECRUITER', async () => {
      repo.findByUserId.mockResolvedValue({ role: 'OWNER', companyId: 'c1' });
      repo.findById.mockResolvedValue({
        id: 'm2',
        companyId: 'c1',
        role: 'RECRUITER',
        userId: 'u2',
      });

      await service.removeMember('owner', 'm2');
      expect(repo.remove).toHaveBeenCalledWith('m2');
      expect(audit.recordRequired).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'company.member.removed' }),
      );
    });
  });
});

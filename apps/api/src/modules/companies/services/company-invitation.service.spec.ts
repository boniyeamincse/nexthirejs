import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CompanyInvitationService } from './company-invitation.service';

describe('CompanyInvitationService', () => {
  let service: CompanyInvitationService;

  const prisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };
  const invitationRepository = {
    findPendingByCompanyAndEmail: jest.fn(),
    findById: jest.fn(),
    listByCompany: jest.fn(),
    listPendingByEmail: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
  };
  const memberRepository = {
    findByCompanyAndUser: jest.fn(),
    create: jest.fn(),
    findByIdWithUser: jest.fn(),
  };
  const membershipService = {
    requireManager: jest.fn(),
  };
  const audit = { recordRequired: jest.fn() };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new CompanyInvitationService(
      prisma as never,
      invitationRepository as never,
      memberRepository as never,
      membershipService as never,
      audit as never,
    );
  });

  describe('invite', () => {
    const validBody = { email: 'invitee@co.com', role: 'RECRUITER' };

    it('rejects invalid payloads', async () => {
      await expect(service.invite('owner', { email: 'not-an-email' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects an ADMIN inviting another ADMIN', async () => {
      membershipService.requireManager.mockResolvedValue({ role: 'ADMIN', companyId: 'c1' });
      await expect(
        service.invite('admin', { email: 'invitee@co.com', role: 'ADMIN' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects inviting an email with no NextHire account', async () => {
      membershipService.requireManager.mockResolvedValue({ role: 'OWNER', companyId: 'c1' });
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.invite('owner', validBody)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects inviting an existing member', async () => {
      membershipService.requireManager.mockResolvedValue({ role: 'OWNER', companyId: 'c1' });
      prisma.user.findUnique.mockResolvedValue({ id: 'u2', email: 'invitee@co.com' });
      memberRepository.findByCompanyAndUser.mockResolvedValue({ id: 'm2' });
      await expect(service.invite('owner', validBody)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a duplicate pending invitation', async () => {
      membershipService.requireManager.mockResolvedValue({ role: 'OWNER', companyId: 'c1' });
      prisma.user.findUnique.mockResolvedValue({ id: 'u2', email: 'invitee@co.com' });
      memberRepository.findByCompanyAndUser.mockResolvedValue(null);
      invitationRepository.findPendingByCompanyAndEmail.mockResolvedValue({ id: 'inv1' });
      await expect(service.invite('owner', validBody)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates an invitation and audits it', async () => {
      membershipService.requireManager.mockResolvedValue({ role: 'OWNER', companyId: 'c1' });
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: 'u2', email: 'invitee@co.com' })
        .mockResolvedValueOnce({ id: 'owner', email: 'owner@co.com', candidateProfile: null });
      memberRepository.findByCompanyAndUser.mockResolvedValue(null);
      invitationRepository.findPendingByCompanyAndEmail.mockResolvedValue(null);
      invitationRepository.create.mockResolvedValue({
        id: 'inv1',
        email: 'invitee@co.com',
        role: 'RECRUITER',
        status: 'PENDING',
        expiresAt: new Date('2026-08-01'),
        createdAt: new Date('2026-07-25'),
      });

      const result = await service.invite('owner', validBody);
      expect(result.id).toBe('inv1');
      expect(audit.recordRequired).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'company.invitation.created' }),
      );
    });
  });

  describe('revoke', () => {
    it('rejects revoking an invitation from a different company', async () => {
      membershipService.requireManager.mockResolvedValue({ role: 'OWNER', companyId: 'c1' });
      invitationRepository.findById.mockResolvedValue({ id: 'inv1', companyId: 'c2' });
      await expect(service.revoke('owner', 'inv1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects revoking a non-pending invitation', async () => {
      membershipService.requireManager.mockResolvedValue({ role: 'OWNER', companyId: 'c1' });
      invitationRepository.findById.mockResolvedValue({
        id: 'inv1',
        companyId: 'c1',
        status: 'ACCEPTED',
      });
      await expect(service.revoke('owner', 'inv1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('revokes a pending invitation', async () => {
      membershipService.requireManager.mockResolvedValue({ role: 'OWNER', companyId: 'c1' });
      invitationRepository.findById.mockResolvedValue({
        id: 'inv1',
        companyId: 'c1',
        status: 'PENDING',
      });

      await service.revoke('owner', 'inv1');
      expect(invitationRepository.updateStatus).toHaveBeenCalledWith(
        'inv1',
        expect.objectContaining({ status: 'REVOKED' }),
      );
    });
  });

  describe('accept / decline', () => {
    it('rejects when the invitation email does not match the caller', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u2', email: 'someone-else@co.com' });
      invitationRepository.findById.mockResolvedValue({
        id: 'inv1',
        email: 'invitee@co.com',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 100000),
      });
      await expect(service.accept('u2', 'inv1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects an expired invitation and marks it EXPIRED', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u2', email: 'invitee@co.com' });
      invitationRepository.findById.mockResolvedValue({
        id: 'inv1',
        email: 'invitee@co.com',
        status: 'PENDING',
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.accept('u2', 'inv1')).rejects.toBeInstanceOf(BadRequestException);
      expect(invitationRepository.updateStatus).toHaveBeenCalledWith(
        'inv1',
        expect.objectContaining({ status: 'EXPIRED' }),
      );
    });

    it('accepts a valid invitation and creates a member', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u2', email: 'invitee@co.com' });
      invitationRepository.findById.mockResolvedValue({
        id: 'inv1',
        email: 'invitee@co.com',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 100000),
        companyId: 'c1',
        role: 'RECRUITER',
        invitedByUserId: 'owner',
      });
      memberRepository.findByCompanyAndUser.mockResolvedValue(null);
      memberRepository.create.mockResolvedValue({ id: 'm2' });
      memberRepository.findByIdWithUser.mockResolvedValue({
        id: 'm2',
        userId: 'u2',
        role: 'RECRUITER',
        joinedAt: new Date('2026-07-25'),
        user: { email: 'invitee@co.com', candidateProfile: null },
      });

      const result = await service.accept('u2', 'inv1');
      expect(memberRepository.create).toHaveBeenCalledWith({
        companyId: 'c1',
        userId: 'u2',
        role: 'RECRUITER',
        invitedByUserId: 'owner',
      });
      expect(result.role).toBe('RECRUITER');
      expect(invitationRepository.updateStatus).toHaveBeenCalledWith(
        'inv1',
        expect.objectContaining({ status: 'ACCEPTED' }),
      );
    });

    it('declines a valid invitation', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u2', email: 'invitee@co.com' });
      invitationRepository.findById.mockResolvedValue({
        id: 'inv1',
        email: 'invitee@co.com',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 100000),
      });

      await service.decline('u2', 'inv1');
      expect(invitationRepository.updateStatus).toHaveBeenCalledWith(
        'inv1',
        expect.objectContaining({ status: 'DECLINED' }),
      );
    });
  });
});

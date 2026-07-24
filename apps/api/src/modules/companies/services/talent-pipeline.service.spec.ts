import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { TalentPipelineService } from './talent-pipeline.service';

describe('TalentPipelineService', () => {
  let service: TalentPipelineService;

  const repository = {
    listByCompany: jest.fn(),
    findByIdForCompany: jest.fn(),
    findByIdAndCompanyId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMember: jest.fn(),
    findMemberById: jest.fn(),
    findMemberByIdWithCandidate: jest.fn(),
    countInStage: jest.fn(),
    listStageMembersOrdered: jest.fn(),
    addMember: jest.fn(),
    updateMember: jest.fn(),
    removeMember: jest.fn(),
    reindexStage: jest.fn(),
  };
  const verifiedAccessService = { requireVerifiedMember: jest.fn() };
  const candidateSearchService = { isDiscoverable: jest.fn() };
  const audit = { recordRequired: jest.fn() };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new TalentPipelineService(
      repository as never,
      verifiedAccessService as never,
      candidateSearchService as never,
      audit as never,
    );
  });

  const memberRecord = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 'm1',
    shortlistId: 's1',
    candidateUserId: 'cand1',
    stage: 'SHORTLISTED',
    notes: null,
    tags: [],
    sortOrder: 0,
    addedAt: new Date('2026-08-01'),
    candidate: { candidateProfile: { fullName: 'Jane Doe', professionalHeadline: 'Engineer' } },
    ...overrides,
  });

  describe('list / getDetail', () => {
    it('lists shortlists for the caller company', async () => {
      verifiedAccessService.requireVerifiedMember.mockResolvedValue({
        companyId: 'c1',
        role: 'VIEWER',
      });
      repository.listByCompany.mockResolvedValue([
        {
          id: 's1',
          name: 'Backend hires',
          description: null,
          _count: { members: 2 },
          createdAt: new Date('2026-08-01'),
          updatedAt: new Date('2026-08-01'),
        },
      ]);

      const result = await service.list('u1');
      expect(repository.listByCompany).toHaveBeenCalledWith('c1');
      expect(result[0]!.memberCount).toBe(2);
    });

    it('rejects getDetail for a shortlist in a different company', async () => {
      verifiedAccessService.requireVerifiedMember.mockResolvedValue({
        companyId: 'c1',
        role: 'VIEWER',
      });
      repository.findByIdForCompany.mockResolvedValue(null);
      await expect(service.getDetail('u1', 's1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create', () => {
    it('rejects a VIEWER creating a shortlist', async () => {
      verifiedAccessService.requireVerifiedMember.mockResolvedValue({
        companyId: 'c1',
        role: 'VIEWER',
      });
      await expect(service.create('u1', { name: 'x' })).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects invalid input', async () => {
      verifiedAccessService.requireVerifiedMember.mockResolvedValue({
        companyId: 'c1',
        role: 'OWNER',
      });
      await expect(service.create('u1', { name: '' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates a shortlist and audits it', async () => {
      verifiedAccessService.requireVerifiedMember.mockResolvedValue({
        companyId: 'c1',
        role: 'ADMIN',
      });
      repository.create.mockResolvedValue({
        id: 's1',
        name: 'Backend hires',
        description: null,
        _count: { members: 0 },
        createdAt: new Date('2026-08-01'),
        updatedAt: new Date('2026-08-01'),
      });

      const result = await service.create('u1', { name: 'Backend hires' });
      expect(result.id).toBe('s1');
      expect(audit.recordRequired).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'talent_shortlist.created' }),
      );
    });
  });

  describe('update / remove', () => {
    it('rejects updating a shortlist outside the caller company', async () => {
      verifiedAccessService.requireVerifiedMember.mockResolvedValue({
        companyId: 'c1',
        role: 'OWNER',
      });
      repository.findByIdAndCompanyId.mockResolvedValue(null);
      await expect(service.update('u1', 's1', { name: 'x' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects a RECRUITER deleting nothing goes fine, VIEWER deleting is blocked', async () => {
      verifiedAccessService.requireVerifiedMember.mockResolvedValue({
        companyId: 'c1',
        role: 'VIEWER',
      });
      await expect(service.remove('u1', 's1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('deletes a shortlist and audits it', async () => {
      verifiedAccessService.requireVerifiedMember.mockResolvedValue({
        companyId: 'c1',
        role: 'RECRUITER',
      });
      repository.findByIdAndCompanyId.mockResolvedValue({ id: 's1', companyId: 'c1' });

      await service.remove('u1', 's1');
      expect(repository.delete).toHaveBeenCalledWith('s1');
      expect(audit.recordRequired).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'talent_shortlist.deleted' }),
      );
    });
  });

  describe('addMember', () => {
    beforeEach(() => {
      verifiedAccessService.requireVerifiedMember.mockResolvedValue({
        companyId: 'c1',
        role: 'RECRUITER',
      });
      repository.findByIdAndCompanyId.mockResolvedValue({ id: 's1', companyId: 'c1' });
    });

    it('rejects a non-discoverable candidate', async () => {
      candidateSearchService.isDiscoverable.mockResolvedValue(false);
      await expect(
        service.addMember('u1', 's1', { candidateUserId: '11111111-1111-1111-1111-111111111111' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a candidate already on the shortlist', async () => {
      candidateSearchService.isDiscoverable.mockResolvedValue(true);
      repository.findMember.mockResolvedValue({ id: 'm1' });
      await expect(
        service.addMember('u1', 's1', { candidateUserId: '11111111-1111-1111-1111-111111111111' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('adds a candidate at the end of the SHORTLISTED stage', async () => {
      candidateSearchService.isDiscoverable.mockResolvedValue(true);
      repository.findMember.mockResolvedValue(null);
      repository.countInStage.mockResolvedValue(3);
      repository.addMember.mockResolvedValue(memberRecord());

      await service.addMember('u1', 's1', {
        candidateUserId: '11111111-1111-1111-1111-111111111111',
      });

      expect(repository.addMember).toHaveBeenCalledWith(expect.objectContaining({ sortOrder: 3 }));
      expect(audit.recordRequired).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'talent_shortlist.member_added' }),
      );
    });
  });

  describe('updateMember', () => {
    beforeEach(() => {
      verifiedAccessService.requireVerifiedMember.mockResolvedValue({
        companyId: 'c1',
        role: 'RECRUITER',
      });
      repository.findByIdAndCompanyId.mockResolvedValue({ id: 's1', companyId: 'c1' });
    });

    it('rejects a member belonging to a different shortlist', async () => {
      repository.findMemberById.mockResolvedValue(memberRecord({ shortlistId: 'other' }));
      await expect(service.updateMember('u1', 's1', 'm1', { notes: 'x' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('updates notes/tags without touching ordering', async () => {
      repository.findMemberById.mockResolvedValue(memberRecord());
      repository.findMemberByIdWithCandidate.mockResolvedValue(
        memberRecord({ notes: 'Great candidate' }),
      );

      await service.updateMember('u1', 's1', 'm1', { notes: 'Great candidate' });

      expect(repository.updateMember).toHaveBeenCalledWith('m1', { notes: 'Great candidate' });
      expect(repository.reindexStage).not.toHaveBeenCalled();
    });

    it('reindexes the destination stage when moving to a new stage', async () => {
      repository.findMemberById.mockResolvedValue(memberRecord({ stage: 'SHORTLISTED' }));
      repository.listStageMembersOrdered.mockResolvedValue([{ id: 'other1' }, { id: 'other2' }]);
      repository.findMemberByIdWithCandidate.mockResolvedValue(
        memberRecord({ stage: 'CONTACTED' }),
      );

      await service.updateMember('u1', 's1', 'm1', { stage: 'CONTACTED', targetIndex: 0 });

      expect(repository.updateMember).toHaveBeenCalledWith('m1', { stage: 'CONTACTED' });
      expect(repository.reindexStage).toHaveBeenCalledWith('s1', 'CONTACTED', [
        'm1',
        'other1',
        'other2',
      ]);
    });
  });

  describe('removeMember', () => {
    it('removes a member and reindexes the remaining stage members', async () => {
      verifiedAccessService.requireVerifiedMember.mockResolvedValue({
        companyId: 'c1',
        role: 'OWNER',
      });
      repository.findByIdAndCompanyId.mockResolvedValue({ id: 's1', companyId: 'c1' });
      repository.findMemberById.mockResolvedValue(memberRecord());
      repository.listStageMembersOrdered.mockResolvedValue([{ id: 'other1' }]);

      await service.removeMember('u1', 's1', 'm1');

      expect(repository.removeMember).toHaveBeenCalledWith('m1');
      expect(repository.reindexStage).toHaveBeenCalledWith('s1', 'SHORTLISTED', ['other1']);
    });
  });
});

import type {
  TalentShortlistSummary,
  TalentShortlistDetail,
  TalentShortlistMemberResult,
  TalentPipelineStageValue,
} from '@nexthire/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapShortlistSummary(record: any): TalentShortlistSummary {
  return {
    id: record.id,
    name: record.name,
    description: record.description ?? null,
    memberCount: record._count?.members ?? 0,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapShortlistMember(record: any): TalentShortlistMemberResult {
  return {
    id: record.id,
    candidateUserId: record.candidateUserId,
    displayName: record.candidate?.candidateProfile?.fullName ?? 'Unknown',
    professionalHeadline: record.candidate?.candidateProfile?.professionalHeadline ?? null,
    stage: record.stage as TalentPipelineStageValue,
    notes: record.notes ?? null,
    tags: record.tags ?? [],
    sortOrder: record.sortOrder,
    addedAt: record.addedAt.toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapShortlistDetail(record: any): TalentShortlistDetail {
  return {
    ...mapShortlistSummary(record),
    members: (record.members ?? []).map(mapShortlistMember),
  };
}

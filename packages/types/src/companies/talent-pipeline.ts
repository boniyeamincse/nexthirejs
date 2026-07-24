export type TalentPipelineStageValue =
  'SHORTLISTED' | 'CONTACTED' | 'SCREENING' | 'INTERVIEWING' | 'OFFER' | 'HIRED' | 'REJECTED';

export interface TalentShortlistSummary {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TalentShortlistMemberResult {
  id: string;
  candidateUserId: string;
  displayName: string;
  professionalHeadline: string | null;
  stage: TalentPipelineStageValue;
  notes: string | null;
  tags: string[];
  sortOrder: number;
  addedAt: string;
}

export interface TalentShortlistDetail extends TalentShortlistSummary {
  members: TalentShortlistMemberResult[];
}

export interface CreateTalentShortlistInput {
  name: string;
  description?: string;
}

export interface UpdateTalentShortlistInput {
  name?: string;
  description?: string;
}

export interface AddTalentShortlistMemberInput {
  candidateUserId: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateTalentShortlistMemberInput {
  stage?: TalentPipelineStageValue;
  targetIndex?: number;
  notes?: string;
  tags?: string[];
}

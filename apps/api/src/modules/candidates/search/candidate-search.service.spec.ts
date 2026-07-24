import { CandidateSearchService } from './candidate-search.service';
import { CandidatePrivacyDecisionService } from '../privacy/candidate-privacy-decision.service';
import { CandidatePrivacyPolicyService } from '../privacy/candidate-privacy-policy.service';

const basePrivacy = {
  overallDiscoverability: 'PLATFORM_DISCOVERABLE',
  basicProfile: 'PUBLIC',
  locationAndPreferences: 'PLATFORM_ONLY',
  education: 'PLATFORM_ONLY',
  workExperience: 'PLATFORM_ONLY',
  skillsAndLanguages: 'HIDDEN',
  certificationsAndTraining: 'PLATFORM_ONLY',
  achievementsAndLinks: 'PLATFORM_ONLY',
  policyVersion: 'v1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('CandidateSearchService', () => {
  let service: CandidateSearchService;
  const repository = { search: jest.fn(), findDiscoverableById: jest.fn() };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new CandidateSearchService(
      repository as never,
      new CandidatePrivacyDecisionService(),
      new CandidatePrivacyPolicyService(),
    );
  });

  it('maps rows into cards, hiding sections gated by privacy settings', async () => {
    repository.search.mockResolvedValue({
      total: 1,
      rows: [
        {
          id: 'u1',
          candidateProfile: { fullName: 'Jane Doe', professionalHeadline: 'Backend Engineer' },
          candidatePreference: { currentCity: 'Dhaka', country: { name: 'Bangladesh' } },
          profilePrivacy: basePrivacy,
          skills: [{ name: 'TypeScript' }, { name: 'NestJS' }],
        },
      ],
    });

    const result = await service.search({ page: 1, pageSize: 20 });

    expect(result.data).toEqual([
      {
        candidateUserId: 'u1',
        displayName: 'Jane Doe',
        professionalHeadline: 'Backend Engineer',
        location: { city: 'Dhaka', countryName: 'Bangladesh' },
        topSkills: [],
      },
    ]);
    expect(result.pagination).toEqual({ page: 1, pageSize: 20, total: 1, totalPages: 1 });
  });

  it('shows skills when the skillsAndLanguages section is visible', async () => {
    repository.search.mockResolvedValue({
      total: 1,
      rows: [
        {
          id: 'u2',
          candidateProfile: { fullName: 'Sam Lee', professionalHeadline: null },
          candidatePreference: null,
          profilePrivacy: { ...basePrivacy, skillsAndLanguages: 'PLATFORM_ONLY' },
          skills: [{ name: 'Go' }],
        },
      ],
    });

    const result = await service.search({ page: 1, pageSize: 20 });
    expect(result.data[0]!.topSkills).toEqual(['Go']);
    expect(result.data[0]!.location).toEqual({ city: null, countryName: null });
  });

  it('falls back to default (non-discoverable) settings when privacy record is missing', async () => {
    repository.search.mockResolvedValue({
      total: 1,
      rows: [
        {
          id: 'u3',
          candidateProfile: { fullName: 'No Privacy Row', professionalHeadline: null },
          candidatePreference: null,
          profilePrivacy: null,
          skills: [],
        },
      ],
    });

    const result = await service.search({ page: 1, pageSize: 20 });
    expect(result.data[0]!.location).toBeNull();
    expect(result.data[0]!.topSkills).toEqual([]);
  });

  it('reports discoverability by id', async () => {
    repository.findDiscoverableById.mockResolvedValue({ id: 'u1' });
    expect(await service.isDiscoverable('u1')).toBe(true);

    repository.findDiscoverableById.mockResolvedValue(null);
    expect(await service.isDiscoverable('u2')).toBe(false);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfilePreview } from '../ProfilePreview';
import type { OwnerProfilePreview } from '@nexthire/types';

const mockPreview: OwnerProfilePreview = {
  profile: {
    profileId: 'prof-1',
    displayName: 'Jane Doe',
    professionalHeadline: 'Senior Frontend Developer',
    professionalSummary: 'Experienced developer focused on React.',
    location: { city: 'San Francisco', countryName: 'USA' },
    preferredJobRoles: ['Frontend Developer', 'UI Engineer'],
    preferredWorkModes: ['REMOTE', 'HYBRID'],
    preferredEmploymentTypes: ['FULL_TIME', 'CONTRACT'],
    education: [
      {
        id: 'edu-1',
        educationLevel: 'BACHELOR',
        institutionName: 'MIT',
        qualification: 'B.S. Computer Science',
        fieldOfStudy: 'Computer Science',
        startDate: '2014-09-01',
        endDate: '2018-06-01',
        currentlyStudying: false,
        grade: '3.8 GPA',
        description: null,
      },
    ],
    experience: [
      {
        id: 'exp-1',
        companyName: 'Tech Corp',
        jobTitle: 'Senior Frontend Developer',
        employmentType: 'FULL_TIME',
        location: 'San Francisco, CA',
        isRemote: true,
        startDate: '2020-01-01',
        endDate: null,
        currentlyWorking: true,
        responsibilities: 'Lead frontend development.',
        achievements: 'Shipped major redesign.',
      },
    ],
    skills: [
      { id: 'skill-1', name: 'React', level: 'ADVANCED', yearsOfExperience: 5 },
      { id: 'skill-2', name: 'TypeScript', level: 'ADVANCED', yearsOfExperience: 4 },
    ],
    languages: [
      { id: 'lang-1', name: 'English', speaking: 'NATIVE', reading: 'NATIVE', writing: 'NATIVE' },
    ],
    certifications: [
      {
        id: 'cert-1',
        name: 'AWS Certified Developer',
        issuer: 'Amazon',
        issueDate: '2022-03-15',
        doesNotExpire: false,
        expiryDate: '2025-03-15',
        credentialUrl: 'https://example.com/cert',
      },
    ],
    training: [
      {
        id: 'train-1',
        title: 'Advanced React Patterns',
        provider: 'Frontend Masters',
        completionDate: '2023-06-01',
        durationHours: 16,
        description: 'Deep dive into React patterns.',
      },
    ],
    achievements: [
      {
        id: 'ach-1',
        title: 'Best Developer Award',
        issuer: 'Tech Corp',
        achievedAt: '2023-12-01',
        description: 'Awarded for outstanding contributions.',
      },
    ],
    professionalLinks: [
      { id: 'link-1', type: 'LINKEDIN', label: 'LinkedIn', url: 'https://linkedin.com/in/janedoe' },
    ],
    visibleSections: [
      'BASIC_PROFILE',
      'LOCATION_AND_PREFERENCES',
      'EDUCATION',
      'WORK_EXPERIENCE',
      'SKILLS_AND_LANGUAGES',
      'CERTIFICATIONS_AND_TRAINING',
      'ACHIEVEMENTS_AND_LINKS',
    ],
    updatedAt: '2024-06-15T10:00:00.000Z',
  },
  privacySummary: {
    overallVisibility: 'PRIVATE',
    sectionVisibility: {
      BASIC_PROFILE: 'PLATFORM_ONLY',
      LOCATION_AND_PREFERENCES: 'PLATFORM_ONLY',
      EDUCATION: 'PLATFORM_ONLY',
      WORK_EXPERIENCE: 'PLATFORM_ONLY',
      SKILLS_AND_LANGUAGES: 'PLATFORM_ONLY',
      CERTIFICATIONS_AND_TRAINING: 'PLATFORM_ONLY',
      ACHIEVEMENTS_AND_LINKS: 'PLATFORM_ONLY',
    },
    shareLinkEnabled: true,
  },
  completion: {
    percentage: 85,
    version: 'profile-completion-v1',
  },
};

const mockHiddenPreview: OwnerProfilePreview = {
  ...mockPreview,
  privacySummary: {
    ...mockPreview.privacySummary,
    sectionVisibility: {
      BASIC_PROFILE: 'HIDDEN',
      EDUCATION: 'HIDDEN',
      WORK_EXPERIENCE: 'HIDDEN',
      SKILLS_AND_LANGUAGES: 'HIDDEN',
      CERTIFICATIONS_AND_TRAINING: 'HIDDEN',
      ACHIEVEMENTS_AND_LINKS: 'HIDDEN',
      LOCATION_AND_PREFERENCES: 'HIDDEN',
    },
  },
};

const mockEmptyPreview: OwnerProfilePreview = {
  ...mockPreview,
  profile: {
    ...mockPreview.profile,
    education: [],
    experience: [],
    skills: [],
    languages: [],
    certifications: [],
    training: [],
    achievements: [],
    professionalLinks: [],
    preferredJobRoles: [],
    preferredWorkModes: [],
    preferredEmploymentTypes: [],
    professionalSummary: null,
    location: null,
  },
};

describe('ProfilePreview', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders privacy summary with section visibility', () => {
    render(<ProfilePreview preview={mockPreview} accessToken="test-token" />);
    expect(screen.getByText(/PRIVATE/)).toBeInTheDocument();
    expect(screen.getByText('Overall Visibility:')).toBeInTheDocument();
    expect(screen.getByText('Section Visibility:')).toBeInTheDocument();
    expect(screen.getByText('Basic Profile')).toBeInTheDocument();
    const platformOnlyElements = screen.getAllByText('PLATFORM ONLY');
    expect(platformOnlyElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Share Link:')).toBeInTheDocument();
  });

  it('renders profile basic info', () => {
    render(<ProfilePreview preview={mockPreview} accessToken="test-token" />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    const headlineElements = screen.getAllByText('Senior Frontend Developer');
    expect(headlineElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('San Francisco, USA')).toBeInTheDocument();
    expect(screen.getByText('Experienced developer focused on React.')).toBeInTheDocument();
  });

  it('renders preferred job roles, work modes, employment types', () => {
    render(<ProfilePreview preview={mockPreview} accessToken="test-token" />);
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('UI Engineer')).toBeInTheDocument();
    expect(screen.getByText('REMOTE, HYBRID')).toBeInTheDocument();
    expect(screen.getByText('FULL_TIME, CONTRACT')).toBeInTheDocument();
  });
  
  it('renders experience section content', () => {
    render(<ProfilePreview preview={mockPreview} accessToken="test-token" />);
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
  });

  it('renders education section', () => {
    render(<ProfilePreview preview={mockPreview} accessToken="test-token" />);
    expect(screen.getByText('B.S. Computer Science')).toBeInTheDocument();
    expect(screen.getByText('MIT')).toBeInTheDocument();
  });

  it('renders skills section', () => {
    render(<ProfilePreview preview={mockPreview} accessToken="test-token" />);
    const reactElements = screen.getAllByText(/React/);
    expect(reactElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/TypeScript/)).toBeInTheDocument();
  });

  it('renders languages section', () => {
    render(<ProfilePreview preview={mockPreview} accessToken="test-token" />);
    expect(screen.getByText(/English/)).toBeInTheDocument();
  });

  it('renders certifications section', () => {
    render(<ProfilePreview preview={mockPreview} accessToken="test-token" />);
    expect(screen.getByText('AWS Certified Developer')).toBeInTheDocument();
    expect(screen.getByText('Amazon')).toBeInTheDocument();
  });

  it('renders training section', () => {
    render(<ProfilePreview preview={mockPreview} accessToken="test-token" />);
    expect(screen.getByText('Advanced React Patterns')).toBeInTheDocument();
    expect(screen.getByText(/Frontend Masters/)).toBeInTheDocument();
  });

  it('renders achievements section', () => {
    render(<ProfilePreview preview={mockPreview} accessToken="test-token" />);
    expect(screen.getByText('Best Developer Award')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
  });

  it('renders professional links section', () => {
    render(<ProfilePreview preview={mockPreview} accessToken="test-token" />);
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
  });

  it('preview mode selector switches display (no mutation)', async () => {
    const user = userEvent.setup();
    render(<ProfilePreview preview={mockPreview} accessToken="test-token" />);

    expect(screen.getByDisplayValue('OWNER')).toBeChecked();

    const linkOnlyRadio = screen.getByDisplayValue('LINK_ONLY');
    await user.click(linkOnlyRadio);
    expect(linkOnlyRadio).toBeChecked();
    expect(screen.getByDisplayValue('OWNER')).not.toBeChecked();

    const platformRadio = screen.getByDisplayValue('PLATFORM_DISCOVERABLE');
    await user.click(platformRadio);
    expect(platformRadio).toBeChecked();
    expect(linkOnlyRadio).not.toBeChecked();
  });

  it('shows hidden-section indicators only to owner', () => {
    render(<ProfilePreview preview={mockHiddenPreview} accessToken="test-token" />);
    const hiddenMessages = screen.getAllByText(/This section is hidden/);
    expect(hiddenMessages.length).toBeGreaterThanOrEqual(1);
  });

  it('does not show empty sections when not owner', async () => {
    const user = userEvent.setup();
    const nonOwnerPreview = {
      ...mockEmptyPreview,
      privacySummary: {
        ...mockEmptyPreview.privacySummary,
        sectionVisibility: {
          BASIC_PROFILE: 'PLATFORM_ONLY',
          EDUCATION: 'PLATFORM_ONLY',
          WORK_EXPERIENCE: 'PLATFORM_ONLY',
          SKILLS_AND_LANGUAGES: 'PLATFORM_ONLY',
          CERTIFICATIONS_AND_TRAINING: 'PLATFORM_ONLY',
          ACHIEVEMENTS_AND_LINKS: 'PLATFORM_ONLY',
          LOCATION_AND_PREFERENCES: 'PLATFORM_ONLY',
        },
      },
    };

    render(<ProfilePreview preview={nonOwnerPreview} accessToken="test-token" />);
    const linkOnlyRadio = screen.getByDisplayValue('LINK_ONLY');
    await user.click(linkOnlyRadio);
    const emptyTexts = screen.queryAllByText(/No entries added yet/);
    expect(emptyTexts.length).toBe(0);
  });

  it('renders share link controls for owner', () => {
    render(<ProfilePreview preview={mockPreview} accessToken="test-token" />);
    expect(screen.getByText('Share Link Controls')).toBeInTheDocument();
  });

  it('renders rotate and disable buttons for share link', () => {
    render(<ProfilePreview preview={mockPreview} accessToken="test-token" />);
    expect(screen.getByText('Rotate Link')).toBeInTheDocument();
    expect(screen.getByText('Disable Link')).toBeInTheDocument();
  });

  it('renders share link status summary', () => {
    render(<ProfilePreview preview={mockPreview} accessToken="test-token" />);
    expect(screen.getByText('Share Link:')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
  });

  it('renders with accessible fieldsets and legends', () => {
    render(<ProfilePreview preview={mockPreview} accessToken="test-token" />);
    expect(screen.getByText('Preview Mode')).toBeInTheDocument();
    expect(screen.getByText('Privacy Summary')).toBeInTheDocument();
    expect(screen.getByText('Share Link Controls')).toBeInTheDocument();
  });

  it('renders with accessible radiogroup and share controls', () => {
    render(<ProfilePreview preview={mockPreview} accessToken="test-token" />);
    expect(screen.getByRole('radiogroup', { name: /preview mode selector/i })).toBeInTheDocument();
    expect(screen.getByText('Rotate Link')).toBeInTheDocument();
    expect(screen.getByText('Disable Link')).toBeInTheDocument();
  });

  it('shows last updated timestamp', () => {
    render(<ProfilePreview preview={mockPreview} accessToken="test-token" />);
    expect(screen.getByText(/Last updated/)).toBeInTheDocument();
  });
});

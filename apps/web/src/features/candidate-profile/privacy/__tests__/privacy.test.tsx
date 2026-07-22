import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrivacySettingsForm } from '../PrivacySettingsForm';
import type { GetProfilePrivacyResult } from '@/lib/api-client';

const defaultSettings: GetProfilePrivacyResult = {
  overallDiscoverability: 'PRIVATE',
  sections: {
    BASIC_PROFILE: 'PLATFORM_ONLY',
    LOCATION_AND_PREFERENCES: 'HIDDEN',
    EDUCATION: 'PLATFORM_ONLY',
    WORK_EXPERIENCE: 'PLATFORM_ONLY',
    SKILLS_AND_LANGUAGES: 'PLATFORM_ONLY',
    CERTIFICATIONS_AND_TRAINING: 'PLATFORM_ONLY',
    ACHIEVEMENTS_AND_LINKS: 'PLATFORM_ONLY',
  },
  policyVersion: 'candidate-privacy-v1',
  source: 'DEFAULT',
  createdAt: null,
  updatedAt: null,
};

const persistedSettings: GetProfilePrivacyResult = {
  overallDiscoverability: 'LINK_ONLY',
  sections: {
    BASIC_PROFILE: 'PUBLIC',
    LOCATION_AND_PREFERENCES: 'HIDDEN',
    EDUCATION: 'PLATFORM_ONLY',
    WORK_EXPERIENCE: 'PUBLIC',
    SKILLS_AND_LANGUAGES: 'PLATFORM_ONLY',
    CERTIFICATIONS_AND_TRAINING: 'HIDDEN',
    ACHIEVEMENTS_AND_LINKS: 'PLATFORM_ONLY',
  },
  policyVersion: 'candidate-privacy-v1',
  source: 'PERSISTED',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('PrivacySettingsForm', () => {
  it('renders default settings correctly', () => {
    render(<PrivacySettingsForm settings={defaultSettings} onSave={vi.fn()} />);
    expect(screen.getByText(/PRIVATE/)).toBeInTheDocument();
    expect(screen.getByText('Basic Profile')).toBeInTheDocument();
  });

  it('renders overall discoverability controls', () => {
    render(<PrivacySettingsForm settings={defaultSettings} onSave={vi.fn()} />);
    expect(screen.getByDisplayValue('PRIVATE')).toBeChecked();
    expect(screen.getByDisplayValue('LINK_ONLY')).toBeInTheDocument();
    expect(screen.getByDisplayValue('PLATFORM_DISCOVERABLE')).toBeInTheDocument();
  });

  it('renders all supported sections', () => {
    render(<PrivacySettingsForm settings={defaultSettings} onSave={vi.fn()} />);
    expect(screen.getByText('Basic Profile')).toBeInTheDocument();
    expect(screen.getByText('Location & Preferences')).toBeInTheDocument();
    expect(screen.getByText('Education')).toBeInTheDocument();
    expect(screen.getByText('Work Experience')).toBeInTheDocument();
    expect(screen.getByText('Skills & Languages')).toBeInTheDocument();
    expect(screen.getByText('Certifications & Training')).toBeInTheDocument();
    expect(screen.getByText('Achievements & Links')).toBeInTheDocument();
  });

  it('renders section visibility controls per section', () => {
    render(<PrivacySettingsForm settings={defaultSettings} onSave={vi.fn()} />);
    const hiddenRadios = screen.getAllByDisplayValue('HIDDEN');
    const platformRadios = screen.getAllByDisplayValue('PLATFORM_ONLY');
    const publicRadios = screen.getAllByDisplayValue('PUBLIC');
    expect(hiddenRadios.length).toBeGreaterThanOrEqual(7);
    expect(platformRadios.length).toBeGreaterThanOrEqual(7);
    expect(publicRadios.length).toBeGreaterThanOrEqual(7);
  });

  it('persisted settings populate controls correctly', () => {
    render(<PrivacySettingsForm settings={persistedSettings} onSave={vi.fn()} />);
    expect(screen.getByDisplayValue('LINK_ONLY')).toBeChecked();
    const publicRadios = screen.getAllByDisplayValue('PUBLIC');
    expect(publicRadios.length).toBeGreaterThanOrEqual(2);
  });

  it('overall discoverability can be changed', async () => {
    const user = userEvent.setup();
    render(<PrivacySettingsForm settings={defaultSettings} onSave={vi.fn()} />);
    const linkOnlyRadio = screen.getByDisplayValue('LINK_ONLY');
    await user.click(linkOnlyRadio);
    expect(linkOnlyRadio).toBeChecked();
  });

  it('disables save button when no changes', () => {
    render(<PrivacySettingsForm settings={defaultSettings} onSave={vi.fn()} />);
    const saveButton = screen.getByText('Save Privacy Settings');
    expect(saveButton).toBeDisabled();
  });

  it('enables save button after change', async () => {
    const user = userEvent.setup();
    render(<PrivacySettingsForm settings={defaultSettings} onSave={vi.fn()} />);
    const linkOnlyRadio = screen.getByDisplayValue('LINK_ONLY');
    await user.click(linkOnlyRadio);
    const saveButton = screen.getByText('Save Privacy Settings');
    expect(saveButton).not.toBeDisabled();
  });

  it('prevents duplicate submission while saving', async () => {
    const user = userEvent.setup();
    const mockSave = vi
      .fn()
      .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));
    render(<PrivacySettingsForm settings={defaultSettings} onSave={mockSave} />);
    const linkOnlyRadio = screen.getByDisplayValue('LINK_ONLY');
    await user.click(linkOnlyRadio);
    const saveButton = screen.getByText('Save Privacy Settings');
    await user.click(saveButton);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
  });

  it('calls onSave with correct data', async () => {
    const user = userEvent.setup();
    const mockSave = vi.fn();
    render(<PrivacySettingsForm settings={defaultSettings} onSave={mockSave} />);
    const linkOnlyRadio = screen.getByDisplayValue('LINK_ONLY');
    await user.click(linkOnlyRadio);
    const saveButton = screen.getByText('Save Privacy Settings');
    await user.click(saveButton);
    expect(mockSave).toHaveBeenCalledWith({
      overallDiscoverability: 'LINK_ONLY',
      sections: defaultSettings.sections,
    });
  });

  it('shows saved status after successful save', async () => {
    const user = userEvent.setup();
    const mockSave = vi.fn();
    render(<PrivacySettingsForm settings={defaultSettings} onSave={mockSave} />);
    const linkOnlyRadio = screen.getByDisplayValue('LINK_ONLY');
    await user.click(linkOnlyRadio);
    const saveButton = screen.getByText('Save Privacy Settings');
    await user.click(saveButton);
    await screen.findByText('Privacy settings saved successfully.');
  });

  it('shows error message on save failure', async () => {
    const user = userEvent.setup();
    const mockSave = vi.fn().mockRejectedValue(new Error('API error'));
    render(<PrivacySettingsForm settings={defaultSettings} onSave={mockSave} />);
    const linkOnlyRadio = screen.getByDisplayValue('LINK_ONLY');
    await user.click(linkOnlyRadio);
    const saveButton = screen.getByText('Save Privacy Settings');
    await user.click(saveButton);
    await screen.findByText('API error');
  });

  it('shows future-feature warning for LINK_ONLY', async () => {
    const user = userEvent.setup();
    render(<PrivacySettingsForm settings={defaultSettings} onSave={vi.fn()} />);
    const linkOnlyRadio = screen.getByDisplayValue('LINK_ONLY');
    await user.click(linkOnlyRadio);
    expect(screen.getByRole('alert')).toHaveTextContent(/not yet active/);
  });

  it('shows future-feature warning for PLATFORM_DISCOVERABLE', async () => {
    const user = userEvent.setup();
    render(<PrivacySettingsForm settings={defaultSettings} onSave={vi.fn()} />);
    const platformRadio = screen.getByDisplayValue('PLATFORM_DISCOVERABLE');
    await user.click(platformRadio);
    expect(screen.getByRole('alert')).toHaveTextContent(/not yet active/);
  });

  it('does not show warning for PRIVATE', () => {
    render(<PrivacySettingsForm settings={defaultSettings} onSave={vi.fn()} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows unsaved changes indicator after modification', async () => {
    const user = userEvent.setup();
    render(<PrivacySettingsForm settings={defaultSettings} onSave={vi.fn()} />);
    expect(screen.queryByText(/unsaved changes/)).not.toBeInTheDocument();
    const linkOnlyRadio = screen.getByDisplayValue('LINK_ONLY');
    await user.click(linkOnlyRadio);
    expect(screen.getByText(/unsaved changes/)).toBeInTheDocument();
  });

  it('renders with accessible fieldsets and legends', () => {
    render(<PrivacySettingsForm settings={defaultSettings} onSave={vi.fn()} />);
    const legends = screen.getAllByText(
      /Overall Profile Discoverability|Section Visibility|Basic Profile|Location & Preferences|Education|Work Experience|Skills & Languages|Certifications & Training|Achievements & Links/,
    );
    expect(legends.length).toBeGreaterThanOrEqual(8);
  });
});

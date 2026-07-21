import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LanguageList } from '@/features/candidate-profile/languages/LanguageList';
import { LanguageForm } from '@/features/candidate-profile/languages/LanguageForm';
import type { CandidateLanguageResult } from '@nexthire/types';
import { LanguageProficiency } from '@nexthire/types';

const mockLanguage: CandidateLanguageResult = {
  id: '1',
  name: 'English',
  speaking: LanguageProficiency.FLUENT,
  reading: LanguageProficiency.NATIVE,
  writing: LanguageProficiency.PROFESSIONAL,
  sortOrder: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockLanguage2: CandidateLanguageResult = {
  id: '2',
  name: 'Spanish',
  speaking: LanguageProficiency.BASIC,
  reading: LanguageProficiency.CONVERSATIONAL,
  writing: LanguageProficiency.BASIC,
  sortOrder: 1,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('LanguageList', () => {
  it('renders empty state', () => {
    render(<LanguageList records={[]} onEdit={vi.fn()} onDelete={vi.fn()} onMoveUp={vi.fn()} onMoveDown={vi.fn()} />);
    expect(screen.getByText('No languages added yet')).toBeInTheDocument();
  });

  it('renders language records', () => {
    render(<LanguageList records={[mockLanguage]} onEdit={vi.fn()} onDelete={vi.fn()} onMoveUp={vi.fn()} onMoveDown={vi.fn()} />);
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Fluent')).toBeInTheDocument();
    expect(screen.getByText('Native')).toBeInTheDocument();
    expect(screen.getByText('Professional')).toBeInTheDocument();
  });

  it('calls onEdit with the record', async () => {
    const onEdit = vi.fn();
    render(<LanguageList records={[mockLanguage]} onEdit={onEdit} onDelete={vi.fn()} onMoveUp={vi.fn()} onMoveDown={vi.fn()} />);
    await userEvent.click(screen.getByLabelText('Edit English'));
    expect(onEdit).toHaveBeenCalledWith(mockLanguage);
  });

  it('calls onDelete with the id', async () => {
    const onDelete = vi.fn();
    render(<LanguageList records={[mockLanguage]} onEdit={vi.fn()} onDelete={onDelete} onMoveUp={vi.fn()} onMoveDown={vi.fn()} />);
    await userEvent.click(screen.getByLabelText('Delete English'));
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('calls onMoveUp and onMoveDown', async () => {
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();
    render(<LanguageList records={[mockLanguage, mockLanguage2]} onEdit={vi.fn()} onDelete={vi.fn()} onMoveUp={onMoveUp} onMoveDown={onMoveDown} />);
    const moveUpButtons = screen.getAllByLabelText('Move up');
    const moveDownButtons = screen.getAllByLabelText('Move down');
    await userEvent.click(moveUpButtons[1]!);
    expect(onMoveUp).toHaveBeenCalledWith(1);
    await userEvent.click(moveDownButtons[0]!);
    expect(onMoveDown).toHaveBeenCalledWith(0);
  });

  it('disables move up for first item', () => {
    render(<LanguageList records={[mockLanguage, mockLanguage2]} onEdit={vi.fn()} onDelete={vi.fn()} onMoveUp={vi.fn()} onMoveDown={vi.fn()} />);
    const moveUpButtons = screen.getAllByLabelText('Move up');
    expect(moveUpButtons[0]!).toBeDisabled();
  });

  it('disables move down for last item', () => {
    render(<LanguageList records={[mockLanguage, mockLanguage2]} onEdit={vi.fn()} onDelete={vi.fn()} onMoveUp={vi.fn()} onMoveDown={vi.fn()} />);
    const moveDownButtons = screen.getAllByLabelText('Move down');
    expect(moveDownButtons[1]!).toBeDisabled();
  });
});

describe('LanguageForm', () => {
  it('shows add mode by default', () => {
    render(<LanguageForm onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Add New Language')).toBeInTheDocument();
    expect(screen.getByText('Add Language')).toBeInTheDocument();
  });

  it('shows edit mode with initial data', () => {
    render(<LanguageForm initialData={mockLanguage} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Edit Language')).toBeInTheDocument();
    expect(screen.getByDisplayValue('English')).toBeInTheDocument();
    expect(screen.getByDisplayValue('FLUENT')).toBeInTheDocument();
    expect(screen.getByDisplayValue('NATIVE')).toBeInTheDocument();
    expect(screen.getByDisplayValue('PROFESSIONAL')).toBeInTheDocument();
  });

  it('calls onSave with form data', async () => {
    const onSave = vi.fn();
    render(<LanguageForm onSave={onSave} onCancel={vi.fn()} />);
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. English/), 'French');
    const comboboxes = screen.getAllByRole('combobox');
    fireEvent.change(comboboxes[0]!, { target: { value: LanguageProficiency.CONVERSATIONAL } });
    fireEvent.change(comboboxes[1]!, { target: { value: LanguageProficiency.BASIC } });
    fireEvent.change(comboboxes[2]!, { target: { value: LanguageProficiency.BASIC } });
    await userEvent.click(screen.getByText('Add Language'));
    expect(onSave).toHaveBeenCalledWith({ name: 'French', speaking: 'CONVERSATIONAL', reading: 'BASIC', writing: 'BASIC' });
  });

  it('shows validation error for empty name', async () => {
    render(<LanguageForm onSave={vi.fn()} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByText('Add Language'));
    expect(screen.getByText('Language name is required')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button clicked', async () => {
    const onCancel = vi.fn();
    render(<LanguageForm onSave={vi.fn()} onCancel={onCancel} />);
    await userEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('updates button text in edit mode', () => {
    render(<LanguageForm initialData={mockLanguage} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Update Language')).toBeInTheDocument();
  });
});

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SkillList } from '@/features/candidate-profile/skills/SkillList';
import { SkillForm } from '@/features/candidate-profile/skills/SkillForm';
import type { CandidateSkillResult } from '@nexthire/types';
import { SkillLevel } from '@nexthire/types';

const mockSkill: CandidateSkillResult = {
  id: '1',
  name: 'TypeScript',
  level: SkillLevel.ADVANCED,
  yearsOfExperience: 5,
  sortOrder: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockSkill2: CandidateSkillResult = {
  id: '2',
  name: 'Python',
  level: SkillLevel.INTERMEDIATE,
  yearsOfExperience: 3,
  sortOrder: 1,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('SkillList', () => {
  it('renders empty state', () => {
    render(
      <SkillList
        records={[]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />,
    );
    expect(screen.getByText('No skills added yet')).toBeInTheDocument();
  });

  it('renders skill records', () => {
    render(
      <SkillList
        records={[mockSkill]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />,
    );
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('ADVANCED')).toBeInTheDocument();
    expect(screen.getByText('5 years of experience')).toBeInTheDocument();
  });

  it('calls onEdit with the record', async () => {
    const onEdit = vi.fn();
    render(
      <SkillList
        records={[mockSkill]}
        onEdit={onEdit}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByLabelText('Edit TypeScript'));
    expect(onEdit).toHaveBeenCalledWith(mockSkill);
  });

  it('calls onDelete with the id', async () => {
    const onDelete = vi.fn();
    render(
      <SkillList
        records={[mockSkill]}
        onEdit={vi.fn()}
        onDelete={onDelete}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByLabelText('Delete TypeScript'));
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('calls onMoveUp and onMoveDown', async () => {
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();
    render(
      <SkillList
        records={[mockSkill, mockSkill2]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />,
    );
    const moveUpButtons = screen.getAllByLabelText('Move up');
    const moveDownButtons = screen.getAllByLabelText('Move down');
    await userEvent.click(moveUpButtons[1]!);
    expect(onMoveUp).toHaveBeenCalledWith(1);
    await userEvent.click(moveDownButtons[0]!);
    expect(onMoveDown).toHaveBeenCalledWith(0);
  });

  it('disables move up for first item', () => {
    render(
      <SkillList
        records={[mockSkill, mockSkill2]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />,
    );
    const moveUpButtons = screen.getAllByLabelText('Move up');
    expect(moveUpButtons[0]!).toBeDisabled();
  });

  it('disables move down for last item', () => {
    render(
      <SkillList
        records={[mockSkill, mockSkill2]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />,
    );
    const moveDownButtons = screen.getAllByLabelText('Move down');
    expect(moveDownButtons[1]!).toBeDisabled();
  });
});

describe('SkillForm', () => {
  it('shows add mode by default', () => {
    render(<SkillForm onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Add New Skill')).toBeInTheDocument();
    expect(screen.getByText('Add Skill')).toBeInTheDocument();
  });

  it('shows edit mode with initial data', () => {
    render(<SkillForm initialData={mockSkill} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Edit Skill')).toBeInTheDocument();
    expect(screen.getByDisplayValue('TypeScript')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ADVANCED')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  it('calls onSave with form data', async () => {
    const onSave = vi.fn();
    render(<SkillForm onSave={onSave} onCancel={vi.fn()} />);
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. React/), 'React');
    fireEvent.change(screen.getByRole('combobox'), { target: { value: SkillLevel.INTERMEDIATE } });
    await userEvent.click(screen.getByText('Add Skill'));
    expect(onSave).toHaveBeenCalledWith({
      name: 'React',
      level: 'INTERMEDIATE',
      yearsOfExperience: null,
    });
  });

  it('shows validation error for empty name', async () => {
    render(<SkillForm onSave={vi.fn()} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByText('Add Skill'));
    expect(screen.getByText('Skill name is required')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button clicked', async () => {
    const onCancel = vi.fn();
    render(<SkillForm onSave={vi.fn()} onCancel={onCancel} />);
    await userEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('updates button text in edit mode', () => {
    render(<SkillForm initialData={mockSkill} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Update Skill')).toBeInTheDocument();
  });
});

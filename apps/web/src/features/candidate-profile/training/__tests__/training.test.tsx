import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TrainingList } from '@/features/candidate-profile/training/TrainingList';
import { TrainingForm } from '@/features/candidate-profile/training/TrainingForm';
import type { CandidateTrainingResult } from '@nexthire/types';

const mockTraining: CandidateTrainingResult = {
  id: '1',
  title: 'Advanced TypeScript',
  provider: 'Udemy',
  completionDate: '2024-03-01T00:00:00.000Z',
  durationHours: 12.5,
  description: 'In-depth TypeScript course.',
  sortOrder: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockTraining2: CandidateTrainingResult = {
  id: '2',
  title: 'React Fundamentals',
  provider: 'Pluralsight',
  completionDate: '2024-02-01T00:00:00.000Z',
  durationHours: null,
  description: null,
  sortOrder: 1,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('TrainingList', () => {
  it('renders empty state', () => {
    render(
      <TrainingList
        records={[]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />,
    );
    expect(screen.getByText('No training records added yet')).toBeInTheDocument();
  });

  it('renders training records', () => {
    render(
      <TrainingList
        records={[mockTraining]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />,
    );
    expect(screen.getByText('Advanced TypeScript')).toBeInTheDocument();
    expect(screen.getByText(/Udemy/)).toBeInTheDocument();
    expect(screen.getByText(/12\.5 hours/)).toBeInTheDocument();
  });

  it('calls onEdit with the record', async () => {
    const onEdit = vi.fn();
    render(
      <TrainingList
        records={[mockTraining]}
        onEdit={onEdit}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByLabelText('Edit Advanced TypeScript'));
    expect(onEdit).toHaveBeenCalledWith(mockTraining);
  });

  it('calls onDelete with the id', async () => {
    const onDelete = vi.fn();
    render(
      <TrainingList
        records={[mockTraining]}
        onEdit={vi.fn()}
        onDelete={onDelete}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByLabelText('Delete Advanced TypeScript'));
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('calls onMoveUp and onMoveDown', async () => {
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();
    render(
      <TrainingList
        records={[mockTraining, mockTraining2]}
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
      <TrainingList
        records={[mockTraining, mockTraining2]}
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
      <TrainingList
        records={[mockTraining, mockTraining2]}
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

describe('TrainingForm', () => {
  it('shows add mode by default', () => {
    render(<TrainingForm onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Add New Training')).toBeInTheDocument();
    expect(screen.getByText('Add Training')).toBeInTheDocument();
  });

  it('shows edit mode with initial data', () => {
    render(<TrainingForm initialData={mockTraining} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Edit Training')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Advanced TypeScript')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Udemy')).toBeInTheDocument();
    expect(screen.getByDisplayValue('12.5')).toBeInTheDocument();
  });

  it('calls onSave with form data', async () => {
    const onSave = vi.fn();
    render(<TrainingForm onSave={onSave} onCancel={vi.fn()} />);
    await userEvent.type(
      screen.getByPlaceholderText(/e\.g\. (Advanced TypeScript|React)/),
      'New Training',
    );
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Udemy, Coursera/), 'New Provider');
    const dateInputs = screen.getAllByDisplayValue('');
    if (dateInputs[0]) {
      await userEvent.type(dateInputs[0], '2024-06-15');
    }
    await userEvent.click(screen.getByText('Add Training'));
    expect(onSave).toHaveBeenCalled();
  });

  it('shows validation error for empty title', async () => {
    render(<TrainingForm onSave={vi.fn()} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByText('Add Training'));
    expect(screen.getByText('Training title is required')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button clicked', async () => {
    const onCancel = vi.fn();
    render(<TrainingForm onSave={vi.fn()} onCancel={onCancel} />);
    await userEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('updates button text in edit mode', () => {
    render(<TrainingForm initialData={mockTraining} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Update Training')).toBeInTheDocument();
  });
});

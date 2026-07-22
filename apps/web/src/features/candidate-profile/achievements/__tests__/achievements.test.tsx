import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AchievementForm } from '../AchievementForm';
import { AchievementList } from '../AchievementList';
import type { CandidateAchievementResult } from '@nexthire/types';

const mockAchievement: CandidateAchievementResult = {
  id: '1',
  title: 'Test Achievement',
  issuer: 'Test Corp',
  achievedAt: '2024-06-15T00:00:00.000Z',
  description: 'Test description',
  referenceUrl: 'https://example.com',
  sortOrder: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('AchievementForm', () => {
  it('shows add mode by default', () => {
    render(<AchievementForm onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Add New Achievement')).toBeInTheDocument();
  });

  it('shows edit mode with initial data', () => {
    render(<AchievementForm initialData={mockAchievement} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Edit Achievement')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Achievement')).toBeInTheDocument();
  });

  it('calls onSave with form data', async () => {
    const onSave = vi.fn();
    render(<AchievementForm onSave={onSave} onCancel={vi.fn()} />);
    await userEvent.type(
      screen.getByPlaceholderText(/e\.g\. Employee of the Year/),
      'New Achievement',
    );
    await userEvent.click(screen.getByText('Add Achievement'));
    expect(onSave).toHaveBeenCalled();
  });

  it('shows validation error for empty title', async () => {
    render(<AchievementForm onSave={vi.fn()} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByText('Add Achievement'));
    expect(screen.getByText('Achievement title is required')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button clicked', async () => {
    const onCancel = vi.fn();
    render(<AchievementForm onSave={vi.fn()} onCancel={onCancel} />);
    await userEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('rejects unsafe URL scheme', async () => {
    render(<AchievementForm onSave={vi.fn()} onCancel={vi.fn()} />);
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Employee of the Year/), 'Test');
    await userEvent.type(
      screen.getByPlaceholderText(/https:\/\/example\.com/),
      'javascript:alert(1)',
    );
    await userEvent.click(screen.getByText('Add Achievement'));
    expect(screen.getByText(/must start with http/)).toBeInTheDocument();
  });

  it('updates button text in edit mode', () => {
    render(<AchievementForm initialData={mockAchievement} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Update Achievement')).toBeInTheDocument();
  });
});

describe('AchievementList', () => {
  const defaultProps = {
    records: [mockAchievement],
    onSave: vi.fn(),
    onDelete: vi.fn(),
    onMoveUp: vi.fn(),
    onMoveDown: vi.fn(),
    editingIndex: null,
    setEditingIndex: vi.fn(),
    showForm: false,
    setShowForm: vi.fn(),
    saving: false,
    errorMsg: null,
  };

  it('renders achievement records', () => {
    render(<AchievementList {...defaultProps} />);
    expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    expect(screen.getByText('Test Corp')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<AchievementList {...defaultProps} records={[]} />);
    expect(screen.getByText(/No achievements yet/)).toBeInTheDocument();
  });

  it('renders saving state', () => {
    render(<AchievementList {...defaultProps} saving={true} />);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('calls onDelete with the id', async () => {
    const onDelete = vi.fn();
    render(<AchievementList {...defaultProps} onDelete={onDelete} />);
    await userEvent.click(screen.getByLabelText('Delete'));
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('calls onMoveUp and onMoveDown', async () => {
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();
    const records = [mockAchievement, { ...mockAchievement, id: '2', title: 'Second Achievement' }];
    render(
      <AchievementList
        {...defaultProps}
        records={records}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />,
    );
    const buttons = screen.getAllByLabelText('Move up');
    await userEvent.click(buttons[1]);
    expect(onMoveUp).toHaveBeenCalledWith(1);
  });

  it('disables move up for first item', () => {
    render(<AchievementList {...defaultProps} />);
    expect(screen.getByLabelText('Move up')).toBeDisabled();
  });
});

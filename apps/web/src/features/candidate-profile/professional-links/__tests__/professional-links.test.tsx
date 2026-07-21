import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfessionalLinkForm } from '../ProfessionalLinkForm';
import { ProfessionalLinkList } from '../ProfessionalLinkList';
import type { CandidateProfessionalLinkResult } from '@nexthire/types';
import { ProfessionalLinkType } from '@nexthire/types';

const mockLink: CandidateProfessionalLinkResult = {
  id: '1',
  type: ProfessionalLinkType.LINKEDIN,
  label: 'My LinkedIn',
  url: 'https://linkedin.com/in/testuser',
  sortOrder: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('ProfessionalLinkForm', () => {
  it('shows add mode by default', () => {
    render(<ProfessionalLinkForm onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Add New Professional Link')).toBeInTheDocument();
  });

  it('shows edit mode with initial data', () => {
    render(<ProfessionalLinkForm initialData={mockLink} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Edit Professional Link')).toBeInTheDocument();
    expect(screen.getByDisplayValue('My LinkedIn')).toBeInTheDocument();
  });

  it('calls onSave with form data', async () => {
    const onSave = vi.fn();
    render(<ProfessionalLinkForm onSave={onSave} onCancel={vi.fn()} />);
    const urlInput = screen.getByPlaceholderText('https://');
    await userEvent.type(urlInput, 'https://github.com/testuser');
    await userEvent.click(screen.getByText('Add Link'));
    expect(onSave).toHaveBeenCalled();
  });

  it('shows validation error for empty URL', async () => {
    render(<ProfessionalLinkForm onSave={vi.fn()} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByText('Add Link'));
    expect(screen.getByText('URL is required')).toBeInTheDocument();
  });

  it('rejects unsafe URL scheme', async () => {
    render(<ProfessionalLinkForm onSave={vi.fn()} onCancel={vi.fn()} />);
    const urlInput = screen.getByPlaceholderText('https://');
    await userEvent.type(urlInput, 'javascript:alert(1)');
    await userEvent.click(screen.getByText('Add Link'));
    expect(screen.getByText(/must start with http/)).toBeInTheDocument();
  });

  it('calls onCancel when cancel button clicked', async () => {
    const onCancel = vi.fn();
    render(<ProfessionalLinkForm onSave={vi.fn()} onCancel={onCancel} />);
    await userEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('updates button text in edit mode', () => {
    render(<ProfessionalLinkForm initialData={mockLink} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Update Link')).toBeInTheDocument();
  });
});

describe('ProfessionalLinkList', () => {
  const defaultProps = {
    records: [mockLink],
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
    duplicateWarning: null,
  };

  it('renders link records', () => {
    render(<ProfessionalLinkList {...defaultProps} />);
    expect(screen.getByText('My LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<ProfessionalLinkList {...defaultProps} records={[]} />);
    expect(screen.getByText(/No professional links yet/)).toBeInTheDocument();
  });

  it('renders saving state', () => {
    render(<ProfessionalLinkList {...defaultProps} saving={true} />);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('shows duplicate warning', () => {
    render(<ProfessionalLinkList {...defaultProps} duplicateWarning="A link with this URL already exists." />);
    expect(screen.getByText('A link with this URL already exists.')).toBeInTheDocument();
  });

  it('calls onDelete with the id', async () => {
    const onDelete = vi.fn();
    render(<ProfessionalLinkList {...defaultProps} onDelete={onDelete} />);
    await userEvent.click(screen.getByLabelText('Delete'));
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('calls onMoveUp', async () => {
    const onMoveUp = vi.fn();
    const records = [
      mockLink,
      { ...mockLink, id: '2', url: 'https://github.com/testuser' },
    ];
    render(
      <ProfessionalLinkList
        {...defaultProps}
        records={records}
        onMoveUp={onMoveUp}
      />
    );
    const buttons = screen.getAllByLabelText('Move up');
    await userEvent.click(buttons[1]);
    expect(onMoveUp).toHaveBeenCalledWith(1);
  });

  it('disables move up for first item', () => {
    render(<ProfessionalLinkList {...defaultProps} />);
    expect(screen.getByLabelText('Move up')).toBeDisabled();
  });

  it('has external link with safe attributes', () => {
    render(<ProfessionalLinkList {...defaultProps} />);
    const link = screen.getByText('https://linkedin.com/in/testuser');
    expect(link.closest('a')).toHaveAttribute('target', '_blank');
    expect(link.closest('a')).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CertificationList } from '@/features/candidate-profile/certifications/CertificationList';
import { CertificationForm } from '@/features/candidate-profile/certifications/CertificationForm';
import type { CandidateCertificationResult } from '@nexthire/types';

const mockCert: CandidateCertificationResult = {
  id: '1',
  name: 'AWS Solutions Architect',
  issuer: 'Amazon Web Services',
  issueDate: '2023-06-15T00:00:00.000Z',
  expiryDate: '2026-06-15T00:00:00.000Z',
  doesNotExpire: false,
  credentialId: 'AWS-123',
  credentialUrl: 'https://aws.amazon.com/verify/123',
  sortOrder: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockCert2: CandidateCertificationResult = {
  id: '2',
  name: 'Google Cloud Professional',
  issuer: 'Google Cloud',
  issueDate: '2024-01-01T00:00:00.000Z',
  expiryDate: null,
  doesNotExpire: true,
  credentialId: null,
  credentialUrl: null,
  sortOrder: 1,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('CertificationList', () => {
  it('renders empty state', () => {
    render(
      <CertificationList
        records={[]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />,
    );
    expect(screen.getByText('No certifications added yet')).toBeInTheDocument();
  });

  it('renders certification records', () => {
    render(
      <CertificationList
        records={[mockCert]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />,
    );
    expect(screen.getByText('AWS Solutions Architect')).toBeInTheDocument();
    expect(screen.getByText(/Amazon Web Services/)).toBeInTheDocument();
    expect(screen.getByText(/AWS-123/)).toBeInTheDocument();
  });

  it('calls onEdit with the record', async () => {
    const onEdit = vi.fn();
    render(
      <CertificationList
        records={[mockCert]}
        onEdit={onEdit}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByLabelText('Edit AWS Solutions Architect'));
    expect(onEdit).toHaveBeenCalledWith(mockCert);
  });

  it('calls onDelete with the id', async () => {
    const onDelete = vi.fn();
    render(
      <CertificationList
        records={[mockCert]}
        onEdit={vi.fn()}
        onDelete={onDelete}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByLabelText('Delete AWS Solutions Architect'));
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('calls onMoveUp and onMoveDown', async () => {
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();
    render(
      <CertificationList
        records={[mockCert, mockCert2]}
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
      <CertificationList
        records={[mockCert, mockCert2]}
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
      <CertificationList
        records={[mockCert, mockCert2]}
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

describe('CertificationForm', () => {
  it('shows add mode by default', () => {
    render(<CertificationForm onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Add New Certification')).toBeInTheDocument();
    expect(screen.getByText('Add Certification')).toBeInTheDocument();
  });

  it('shows edit mode with initial data', () => {
    render(<CertificationForm initialData={mockCert} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Edit Certification')).toBeInTheDocument();
    expect(screen.getByDisplayValue('AWS Solutions Architect')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Amazon Web Services')).toBeInTheDocument();
  });

  it('calls onSave with form data', async () => {
    const onSave = vi.fn();
    render(<CertificationForm onSave={onSave} onCancel={vi.fn()} />);
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. AWS Solutions Architect/), 'New Cert');
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Amazon Web Services/), 'New Issuer');
    const dateInputs = screen.getAllByDisplayValue('');
    if (dateInputs[0]) {
      await userEvent.type(dateInputs[0], '2024-06-15');
    }
    await userEvent.click(screen.getByText('Add Certification'));
    expect(onSave).toHaveBeenCalled();
  });

  it('shows validation error for empty name', async () => {
    render(<CertificationForm onSave={vi.fn()} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByText('Add Certification'));
    expect(screen.getByText('Certification name is required')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button clicked', async () => {
    const onCancel = vi.fn();
    render(<CertificationForm onSave={vi.fn()} onCancel={onCancel} />);
    await userEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('checks doesNotExpire disables expiry date', async () => {
    render(<CertificationForm onSave={vi.fn()} onCancel={vi.fn()} />);
    const checkbox = screen.getByLabelText(/does not expire/i);
    await userEvent.click(checkbox);
    const expiryInputs = screen.getAllByDisplayValue('');
    const dateInputs = expiryInputs.filter((el) => el.getAttribute('type') === 'date');
    const expiryInput = dateInputs.find((el) => el.hasAttribute('disabled'));
    expect(expiryInput).toBeDisabled();
  });

  it('updates button text in edit mode', () => {
    render(<CertificationForm initialData={mockCert} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Update Certification')).toBeInTheDocument();
  });
});

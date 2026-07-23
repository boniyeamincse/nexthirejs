import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfilePhotoCard } from '../ProfilePhotoCard';
import * as apiClient from '@/lib/api-client';

const getAccessToken = () => 'test-token';

const noPhotoStatus = {
  hasPhoto: false,
  mimeType: null,
  sizeBytes: null,
  updatedAt: null,
};

const photoStatus = {
  hasPhoto: true,
  mimeType: 'image/png',
  sizeBytes: 1024,
  updatedAt: '2026-07-23T10:00:00.000Z',
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:mock-photo'),
    revokeObjectURL: vi.fn(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function makePngFile(name = 'photo.png', size = 1024): File {
  const file = new File([new Uint8Array(size)], name, { type: 'image/png' });
  return file;
}

describe('ProfilePhotoCard', () => {
  it('shows the upload button when no photo exists', async () => {
    vi.spyOn(apiClient, 'getMyPhotoStatus').mockResolvedValue(noPhotoStatus);

    render(<ProfilePhotoCard getAccessToken={getAccessToken} />);

    expect(await screen.findByRole('button', { name: /upload photo/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
  });

  it('renders the existing photo with replace and remove actions', async () => {
    vi.spyOn(apiClient, 'getMyPhotoStatus').mockResolvedValue(photoStatus);
    vi.spyOn(apiClient, 'fetchMyPhotoObjectUrl').mockResolvedValue('blob:mock-photo');

    render(<ProfilePhotoCard getAccessToken={getAccessToken} />);

    const image = await screen.findByRole('img', { name: /your profile photo/i });
    expect(image).toHaveAttribute('src', 'blob:mock-photo');
    expect(screen.getByRole('button', { name: /replace photo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
  });

  it('uploads a chosen file and shows the new photo', async () => {
    const user = userEvent.setup({ applyAccept: false });
    vi.spyOn(apiClient, 'getMyPhotoStatus').mockResolvedValue(noPhotoStatus);
    const uploadSpy = vi.spyOn(apiClient, 'uploadMyPhoto').mockResolvedValue(photoStatus);
    vi.spyOn(apiClient, 'fetchMyPhotoObjectUrl').mockResolvedValue('blob:mock-photo');

    render(<ProfilePhotoCard getAccessToken={getAccessToken} />);
    await screen.findByRole('button', { name: /upload photo/i });

    const input = screen.getByLabelText(/choose profile photo/i);
    await user.upload(input, makePngFile());

    await waitFor(() => {
      expect(uploadSpy).toHaveBeenCalledWith('test-token', expect.any(File));
    });
    expect(await screen.findByText(/photo updated/i)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /your profile photo/i })).toBeInTheDocument();
  });

  it('rejects a non-image file locally without calling the API', async () => {
    const user = userEvent.setup({ applyAccept: false });
    vi.spyOn(apiClient, 'getMyPhotoStatus').mockResolvedValue(noPhotoStatus);
    const uploadSpy = vi.spyOn(apiClient, 'uploadMyPhoto');

    render(<ProfilePhotoCard getAccessToken={getAccessToken} />);
    await screen.findByRole('button', { name: /upload photo/i });

    const pdf = new File([new Uint8Array(10)], 'doc.pdf', { type: 'application/pdf' });
    await user.upload(screen.getByLabelText(/choose profile photo/i), pdf);

    expect(await screen.findByRole('alert')).toHaveTextContent(/jpeg or png/i);
    expect(uploadSpy).not.toHaveBeenCalled();
  });

  it('rejects an oversized file locally', async () => {
    const user = userEvent.setup({ applyAccept: false });
    vi.spyOn(apiClient, 'getMyPhotoStatus').mockResolvedValue(noPhotoStatus);
    const uploadSpy = vi.spyOn(apiClient, 'uploadMyPhoto');

    render(<ProfilePhotoCard getAccessToken={getAccessToken} />);
    await screen.findByRole('button', { name: /upload photo/i });

    await user.upload(
      screen.getByLabelText(/choose profile photo/i),
      makePngFile('big.png', 3 * 1024 * 1024),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(/2MB or smaller/i);
    expect(uploadSpy).not.toHaveBeenCalled();
  });

  it('shows a server rejection message for invalid content', async () => {
    const user = userEvent.setup({ applyAccept: false });
    vi.spyOn(apiClient, 'getMyPhotoStatus').mockResolvedValue(noPhotoStatus);
    vi.spyOn(apiClient, 'uploadMyPhoto').mockRejectedValue(
      new apiClient.ApiClientError('CANDIDATE_PHOTO_TYPE_UNSUPPORTED', 415),
    );

    render(<ProfilePhotoCard getAccessToken={getAccessToken} />);
    await screen.findByRole('button', { name: /upload photo/i });

    await user.upload(screen.getByLabelText(/choose profile photo/i), makePngFile());

    expect(await screen.findByRole('alert')).toHaveTextContent(/not a valid jpeg or png/i);
  });

  it('removes the photo', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, 'getMyPhotoStatus').mockResolvedValue(photoStatus);
    vi.spyOn(apiClient, 'fetchMyPhotoObjectUrl').mockResolvedValue('blob:mock-photo');
    const deleteSpy = vi.spyOn(apiClient, 'deleteMyPhoto').mockResolvedValue();

    render(<ProfilePhotoCard getAccessToken={getAccessToken} />);

    await user.click(await screen.findByRole('button', { name: /remove/i }));

    expect(deleteSpy).toHaveBeenCalledWith('test-token');
    expect(await screen.findByText(/photo removed/i)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('uses an accessible landmark labelled by its heading', async () => {
    vi.spyOn(apiClient, 'getMyPhotoStatus').mockResolvedValue(noPhotoStatus);

    render(<ProfilePhotoCard getAccessToken={getAccessToken} />);

    await screen.findByRole('button', { name: /upload photo/i });
    expect(screen.getByRole('heading', { name: /profile photo/i })).toHaveAttribute(
      'id',
      'profile-photo-heading',
    );
  });
});

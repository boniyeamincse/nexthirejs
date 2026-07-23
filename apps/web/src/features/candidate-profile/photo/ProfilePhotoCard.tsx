'use client';

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  getMyPhotoStatus,
  uploadMyPhoto,
  fetchMyPhotoObjectUrl,
  deleteMyPhoto,
  ApiClientError,
} from '@/lib/api-client';

interface ProfilePhotoCardProps {
  getAccessToken: () => string | null;
}

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];

const cardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.25rem',
  padding: '1rem',
  background: 'rgba(255,255,255,0.03)',
  borderRadius: '0.75rem',
  marginBottom: '1.5rem',
  flexWrap: 'wrap',
};

const avatarStyle: React.CSSProperties = {
  width: '96px',
  height: '96px',
  borderRadius: '50%',
  objectFit: 'cover',
  background: 'rgba(255,255,255,0.08)',
  border: '2px solid rgba(255,255,255,0.15)',
};

const placeholderStyle: React.CSSProperties = {
  ...avatarStyle,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#94a3b8',
  fontSize: '2rem',
  fontWeight: 600,
};

const buttonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: 'rgba(99, 102, 241, 0.85)',
  color: '#fff',
  border: 'none',
  borderRadius: '0.5rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '0.85rem',
};

const removeButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: 'rgba(255,255,255,0.06)',
  color: '#f87171',
  border: '1px solid rgba(248, 113, 113, 0.35)',
  fontWeight: 500,
};

export function ProfilePhotoCard({ getAccessToken }: ProfilePhotoCardProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const setObjectUrl = useCallback((url: string | null) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    objectUrlRef.current = url;
    setPhotoUrl(url);
  }, []);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const status = await getMyPhotoStatus(token);
      if (status.hasPhoto) {
        const url = await fetchMyPhotoObjectUrl(token);
        setObjectUrl(url);
      } else {
        setObjectUrl(null);
      }
    } catch {
      setError('Unable to load your photo right now.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, setObjectUrl]);

  useEffect(() => {
    void load();
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, [load]);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) {
      return;
    }
    setError(null);
    setStatusMessage(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please choose a JPEG or PNG image.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError('Photos must be 2MB or smaller.');
      return;
    }

    const token = getAccessToken();
    if (!token) {
      return;
    }

    setBusy(true);
    try {
      await uploadMyPhoto(token, file);
      const url = await fetchMyPhotoObjectUrl(token);
      setObjectUrl(url);
      setStatusMessage('Photo updated.');
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 415) {
        setError('That file is not a valid JPEG or PNG image.');
      } else if (err instanceof ApiClientError && err.statusCode === 413) {
        setError('Photos must be 2MB or smaller.');
      } else if (err instanceof ApiClientError && err.statusCode === 400) {
        setError('Save your profile basics before adding a photo.');
      } else {
        setError('Unable to upload the photo. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    const token = getAccessToken();
    if (!token) {
      return;
    }
    setError(null);
    setStatusMessage(null);
    setBusy(true);
    try {
      await deleteMyPhoto(token);
      setObjectUrl(null);
      setStatusMessage('Photo removed.');
    } catch {
      setError('Unable to remove the photo. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={cardStyle} aria-labelledby="profile-photo-heading">
      {photoUrl ? (
        // Object URL from the authenticated photo endpoint; next/image cannot optimize blob URLs.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="Your profile photo" style={avatarStyle} />
      ) : (
        <div style={placeholderStyle} aria-hidden="true">
          {loading ? '…' : '👤'}
        </div>
      )}

      <div style={{ flex: 1, minWidth: '14rem' }}>
        <h2
          id="profile-photo-heading"
          style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: 600 }}
        >
          Profile photo
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.25rem 0 0.75rem' }}>
          JPEG or PNG, up to 2MB. Your photo is private until you share your profile.
        </p>

        <div aria-live="polite">
          {statusMessage && (
            <p style={{ color: '#86efac', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              {statusMessage}
            </p>
          )}
        </div>
        {error && (
          <p role="alert" style={{ color: '#fca5a5', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <input
            ref={fileInputRef}
            id="profile-photo-input"
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            aria-label="Choose profile photo"
          />
          <button
            type="button"
            style={buttonStyle}
            disabled={busy || loading}
            onClick={() => fileInputRef.current?.click()}
          >
            {busy ? 'Working…' : photoUrl ? 'Replace photo' : 'Upload photo'}
          </button>
          {photoUrl && (
            <button
              type="button"
              style={removeButtonStyle}
              disabled={busy}
              onClick={() => void handleRemove()}
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

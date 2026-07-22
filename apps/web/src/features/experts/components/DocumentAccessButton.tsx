import { useState } from 'react';
import { getExpertVerificationDocumentAccess } from '@/lib/api-client';

interface DocumentAccessButtonProps {
  accessToken: string;
  applicationId: string;
  documentId: string;
  label: string;
}

/**
 * Requests a short-lived reviewer download URL and opens it immediately.
 *
 * SECURITY: the signed URL is never stored in component state, browser storage,
 * or logged. It is opened in a new tab and then discarded.
 */
export function DocumentAccessButton({
  accessToken,
  applicationId,
  documentId,
  label,
}: DocumentAccessButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccess = async () => {
    setLoading(true);
    setError(null);
    try {
      const access = await getExpertVerificationDocumentAccess(
        accessToken,
        applicationId,
        documentId,
      );
      // Open and immediately discard the URL — do not persist it.
      const opened = window.open(access.url, '_blank', 'noopener,noreferrer');
      if (!opened) {
        setError('Pop-up blocked. Allow pop-ups to view the document.');
      }
    } catch {
      setError('Could not open the document. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <span>
      <button
        type="button"
        onClick={handleAccess}
        disabled={loading}
        aria-label={`View ${label} (opens a temporary secure link in a new tab)`}
        style={{
          padding: '0.35rem 0.8rem',
          background: '#334155',
          border: '1px solid #475569',
          borderRadius: '0.45rem',
          color: '#e4e4e7',
          fontSize: '0.82rem',
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? 'Opening…' : 'View (secure link)'}
      </button>
      {error && (
        <span
          role="alert"
          style={{ display: 'block', marginTop: '0.25rem', color: '#fca5a5', fontSize: '0.78rem' }}
        >
          {error}
        </span>
      )}
    </span>
  );
}

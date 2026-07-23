'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  getMfaStatus,
  beginMfaEnrollment,
  confirmMfaEnrollment,
  disableMfa,
  regenerateMfaRecoveryCodes,
  listMfaTrustedDevices,
  revokeMfaTrustedDevice,
  revokeAllMfaTrustedDevices,
  ApiClientError,
} from '@/lib/api-client';
import type {
  MfaSecurityStatusResult,
  BeginMfaEnrollmentResult,
  MfaTrustedDeviceSummary,
} from '@/lib/api-client';

interface MfaSettingsPanelProps {
  getAccessToken: () => string | null;
}

type PanelView = 'overview' | 'enroll-password' | 'enroll-verify' | 'recovery-codes' | 'disable';

const sectionStyle: React.CSSProperties = {
  marginBottom: '2rem',
  padding: '1rem',
  background: 'rgba(255,255,255,0.03)',
  borderRadius: '0.5rem',
};

const headingStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 600,
  color: '#e2e8f0',
  marginBottom: '0.75rem',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#94a3b8',
  fontSize: '0.9rem',
  marginBottom: '0.35rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.75rem',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '0.5rem',
  color: '#e2e8f0',
  fontSize: '0.95rem',
};

const primaryButtonStyle: React.CSSProperties = {
  padding: '0.6rem 1.2rem',
  background: 'rgba(99, 102, 241, 0.85)',
  color: '#fff',
  border: 'none',
  borderRadius: '0.5rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '0.9rem',
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: '0.6rem 1.2rem',
  background: 'rgba(255,255,255,0.06)',
  color: '#e2e8f0',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '0.5rem',
  fontWeight: 500,
  cursor: 'pointer',
  fontSize: '0.9rem',
};

const dangerButtonStyle: React.CSSProperties = {
  ...secondaryButtonStyle,
  color: '#f87171',
  border: '1px solid rgba(248, 113, 113, 0.35)',
};

const errorStyle: React.CSSProperties = {
  padding: '0.65rem 0.85rem',
  background: 'rgba(239, 68, 68, 0.12)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  borderRadius: '0.5rem',
  color: '#fca5a5',
  fontSize: '0.88rem',
  marginBottom: '0.75rem',
};

const successStyle: React.CSSProperties = {
  padding: '0.65rem 0.85rem',
  background: 'rgba(34, 197, 94, 0.12)',
  border: '1px solid rgba(34, 197, 94, 0.3)',
  borderRadius: '0.5rem',
  color: '#86efac',
  fontSize: '0.88rem',
  marginBottom: '0.75rem',
};

export function MfaSettingsPanel({ getAccessToken }: MfaSettingsPanelProps) {
  const [mfaStatus, setMfaStatus] = useState<MfaSecurityStatusResult | null>(null);
  const [devices, setDevices] = useState<MfaTrustedDeviceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [view, setView] = useState<PanelView>('overview');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [enrollPassword, setEnrollPassword] = useState('');
  const [enrollment, setEnrollment] = useState<BeginMfaEnrollmentResult | null>(null);
  const [confirmCode, setConfirmCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [codesCopied, setCodesCopied] = useState(false);

  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');

  const [regenCode, setRegenCode] = useState('');
  const [showRegen, setShowRegen] = useState(false);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoadError(null);
    try {
      const status = await getMfaStatus(token);
      setMfaStatus(status);
      if (status.status === 'ENABLED') {
        const deviceList = await listMfaTrustedDevices(token);
        setDevices(deviceList.devices);
      } else {
        setDevices([]);
      }
    } catch {
      setLoadError('Two-factor authentication settings are temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetMessages() {
    setActionError(null);
    setActionSuccess(null);
  }

  async function handleBeginEnrollment(e: FormEvent) {
    e.preventDefault();
    resetMessages();
    const token = getAccessToken();
    if (!token) {
      return;
    }
    if (!enrollPassword) {
      setActionError('Enter your current password to continue.');
      return;
    }
    setPending(true);
    try {
      const result = await beginMfaEnrollment(token, enrollPassword);
      setEnrollment(result);
      setEnrollPassword('');
      setConfirmCode('');
      setView('enroll-verify');
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        setActionError('That password is incorrect.');
      } else if (err instanceof ApiClientError && err.statusCode === 429) {
        setActionError('Too many attempts. Please wait and try again.');
      } else {
        setActionError('Unable to start two-factor setup. Please try again.');
      }
    } finally {
      setPending(false);
    }
  }

  async function handleConfirmEnrollment(e: FormEvent) {
    e.preventDefault();
    resetMessages();
    const token = getAccessToken();
    if (!token) {
      return;
    }
    if (!/^[0-9]{6}$/.test(confirmCode.trim())) {
      setActionError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    setPending(true);
    try {
      const result = await confirmMfaEnrollment(token, confirmCode.trim());
      setRecoveryCodes(result.recoveryCodes);
      setCodesCopied(false);
      setEnrollment(null);
      setView('recovery-codes');
      await load();
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        setActionError('That code is incorrect. Check your authenticator app and try again.');
      } else if (err instanceof ApiClientError && err.statusCode === 400) {
        setActionError('Setup session expired. Please start again.');
        setView('enroll-password');
      } else {
        setActionError('Unable to confirm two-factor setup. Please try again.');
      }
    } finally {
      setPending(false);
    }
  }

  async function handleDisable(e: FormEvent) {
    e.preventDefault();
    resetMessages();
    const token = getAccessToken();
    if (!token) {
      return;
    }
    if (!disablePassword || !disableCode.trim()) {
      setActionError('Enter your password and a valid code to disable two-factor authentication.');
      return;
    }
    setPending(true);
    try {
      await disableMfa(token, disablePassword, disableCode.trim());
      setDisablePassword('');
      setDisableCode('');
      setView('overview');
      setActionSuccess('Two-factor authentication has been disabled.');
      await load();
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        setActionError('The password or code is incorrect.');
      } else {
        setActionError('Unable to disable two-factor authentication. Please try again.');
      }
    } finally {
      setPending(false);
    }
  }

  async function handleRegenerate(e: FormEvent) {
    e.preventDefault();
    resetMessages();
    const token = getAccessToken();
    if (!token) {
      return;
    }
    if (!/^[0-9]{6}$/.test(regenCode.trim())) {
      setActionError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    setPending(true);
    try {
      const result = await regenerateMfaRecoveryCodes(token, regenCode.trim());
      setRecoveryCodes(result.recoveryCodes);
      setCodesCopied(false);
      setRegenCode('');
      setShowRegen(false);
      setView('recovery-codes');
      await load();
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        setActionError('That code is incorrect.');
      } else {
        setActionError('Unable to regenerate recovery codes. Please try again.');
      }
    } finally {
      setPending(false);
    }
  }

  async function handleRevokeDevice(deviceId: string) {
    resetMessages();
    const token = getAccessToken();
    if (!token) {
      return;
    }
    try {
      await revokeMfaTrustedDevice(token, deviceId);
      setActionSuccess('Trusted device removed.');
      await load();
    } catch {
      setActionError('Unable to remove the trusted device. Please try again.');
    }
  }

  async function handleRevokeAllDevices() {
    resetMessages();
    const token = getAccessToken();
    if (!token) {
      return;
    }
    try {
      await revokeAllMfaTrustedDevices(token);
      setActionSuccess('All trusted devices removed. You will be asked for a code on next login.');
      await load();
    } catch {
      setActionError('Unable to remove trusted devices. Please try again.');
    }
  }

  async function handleCopyCodes() {
    if (!recoveryCodes) {
      return;
    }
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'));
      setCodesCopied(true);
    } catch {
      setCodesCopied(false);
    }
  }

  if (loading) {
    return (
      <section style={sectionStyle} aria-busy="true">
        <h2 style={headingStyle}>Two-Factor Authentication</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Loading two-factor settings…</p>
      </section>
    );
  }

  if (loadError || !mfaStatus) {
    return (
      <section style={sectionStyle}>
        <h2 style={headingStyle}>Two-Factor Authentication</h2>
        <div style={errorStyle} role="alert">
          {loadError ?? 'Two-factor authentication settings are unavailable.'}
        </div>
        <button type="button" style={secondaryButtonStyle} onClick={() => void load()}>
          Retry
        </button>
      </section>
    );
  }

  return (
    <section style={sectionStyle} aria-labelledby="mfa-heading">
      <h2 id="mfa-heading" style={headingStyle}>
        Two-Factor Authentication
      </h2>

      <div aria-live="polite">
        {actionSuccess && <div style={successStyle}>{actionSuccess}</div>}
      </div>
      {actionError && (
        <div style={errorStyle} role="alert">
          {actionError}
        </div>
      )}

      {mfaStatus.requiredByPolicy && mfaStatus.status !== 'ENABLED' && (
        <div style={errorStyle} role="alert">
          Your account role requires two-factor authentication. Sensitive actions stay locked until
          you enable it.
        </div>
      )}

      {view === 'overview' && mfaStatus.status !== 'ENABLED' && (
        <>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.9rem' }}>
            Add a second sign-in step using an authenticator app (such as Google Authenticator,
            1Password, or Aegis). You&apos;ll also receive one-time recovery codes.
          </p>
          <button
            type="button"
            style={primaryButtonStyle}
            onClick={() => {
              resetMessages();
              setView('enroll-password');
            }}
          >
            Enable Two-Factor Authentication
          </button>
        </>
      )}

      {view === 'enroll-password' && (
        <form onSubmit={handleBeginEnrollment} noValidate>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.9rem' }}>
            Confirm your current password to begin setup.
          </p>
          <div style={{ marginBottom: '0.9rem', maxWidth: '22rem' }}>
            <label htmlFor="mfa-enroll-password" style={labelStyle}>
              Current password
            </label>
            <input
              id="mfa-enroll-password"
              type="password"
              autoComplete="current-password"
              value={enrollPassword}
              onChange={(e) => setEnrollPassword(e.target.value)}
              style={inputStyle}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button type="submit" style={primaryButtonStyle} disabled={pending}>
              {pending ? 'Starting…' : 'Continue'}
            </button>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={() => {
                resetMessages();
                setEnrollPassword('');
                setView('overview');
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {view === 'enroll-verify' && enrollment && (
        <form onSubmit={handleConfirmEnrollment} noValidate>
          <ol style={{ color: '#94a3b8', fontSize: '0.9rem', paddingLeft: '1.2rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>
              Scan this QR code with your authenticator app:
            </li>
          </ol>
          {/* QR data URL is generated server-side from the enrollment secret */}
          <img
            src={enrollment.qrDataUrl}
            alt="QR code for authenticator app setup"
            width={220}
            height={220}
            style={{ borderRadius: '0.5rem', background: '#fff', padding: '0.4rem' }}
          />
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.75rem 0' }}>
            Can&apos;t scan? Enter this key manually:{' '}
            <code
              style={{
                color: '#e2e8f0',
                background: 'rgba(255,255,255,0.08)',
                padding: '0.15rem 0.4rem',
                borderRadius: '0.3rem',
                letterSpacing: '0.08em',
              }}
            >
              {enrollment.manualSecret}
            </code>
          </p>
          <div style={{ marginBottom: '0.9rem', maxWidth: '14rem' }}>
            <label htmlFor="mfa-confirm-code" style={labelStyle}>
              6-digit code from your app
            </label>
            <input
              id="mfa-confirm-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              style={inputStyle}
              placeholder="123456"
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button type="submit" style={primaryButtonStyle} disabled={pending}>
              {pending ? 'Verifying…' : 'Verify and enable'}
            </button>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={() => {
                resetMessages();
                setEnrollment(null);
                setConfirmCode('');
                setView('overview');
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {view === 'recovery-codes' && recoveryCodes && (
        <div>
          <div style={successStyle} role="status">
            Two-factor authentication is set up. Save these recovery codes now — they are shown only
            once.
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '0.75rem' }}>
            Each code can be used once to sign in if you lose access to your authenticator app.
          </p>
          <ul
            style={{
              listStyle: 'none',
              padding: '0.9rem',
              margin: '0 0 0.9rem',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '0.5rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(9rem, 1fr))',
              gap: '0.45rem',
              fontFamily: 'monospace',
              color: '#e2e8f0',
              fontSize: '0.95rem',
              letterSpacing: '0.08em',
            }}
          >
            {recoveryCodes.map((code) => (
              <li key={code}>{code}</li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={() => void handleCopyCodes()}
            >
              {codesCopied ? 'Copied!' : 'Copy codes'}
            </button>
            <button
              type="button"
              style={primaryButtonStyle}
              onClick={() => {
                setRecoveryCodes(null);
                setView('overview');
              }}
            >
              I&apos;ve saved my codes
            </button>
          </div>
        </div>
      )}

      {view === 'overview' && mfaStatus.status === 'ENABLED' && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '0.5rem',
              marginBottom: '0.75rem',
            }}
          >
            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Status</span>
            <span
              style={{
                padding: '0.2rem 0.6rem',
                borderRadius: '0.375rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#22c55e',
              }}
            >
              Enabled
              {mfaStatus.enabledAt
                ? ` since ${new Date(mfaStatus.enabledAt).toLocaleDateString()}`
                : ''}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '0.5rem',
              marginBottom: '0.9rem',
            }}
          >
            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Recovery codes remaining</span>
            <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>
              {mfaStatus.recoveryCodesRemaining}
            </span>
          </div>

          {showRegen ? (
            <form onSubmit={handleRegenerate} noValidate style={{ marginBottom: '0.9rem' }}>
              <div style={{ marginBottom: '0.7rem', maxWidth: '14rem' }}>
                <label htmlFor="mfa-regen-code" style={labelStyle}>
                  6-digit code to confirm regeneration
                </label>
                <input
                  id="mfa-regen-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={regenCode}
                  onChange={(e) => setRegenCode(e.target.value)}
                  style={inputStyle}
                  placeholder="123456"
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button type="submit" style={primaryButtonStyle} disabled={pending}>
                  {pending ? 'Working…' : 'Regenerate codes'}
                </button>
                <button
                  type="button"
                  style={secondaryButtonStyle}
                  onClick={() => {
                    setShowRegen(false);
                    setRegenCode('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div
              style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}
            >
              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={() => {
                  resetMessages();
                  setShowRegen(true);
                }}
              >
                Regenerate recovery codes
              </button>
              <button
                type="button"
                style={dangerButtonStyle}
                onClick={() => {
                  resetMessages();
                  setView('disable');
                }}
              >
                Disable two-factor
              </button>
            </div>
          )}

          <h3 style={{ ...headingStyle, fontSize: '0.98rem' }}>Trusted devices</h3>
          {devices.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
              No trusted devices. Devices you trust at sign-in skip the code for 30 days.
            </p>
          ) : (
            <>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 0.75rem' }}>
                {devices.map((device) => (
                  <li
                    key={device.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.65rem 0.75rem',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '0.5rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <div>
                      <div style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>
                        {device.deviceName || device.browserSummary || 'Unnamed device'}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.78rem' }}>
                        Trusted {new Date(device.trustedAt).toLocaleDateString()} · expires{' '}
                        {new Date(device.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      style={dangerButtonStyle}
                      onClick={() => void handleRevokeDevice(device.id)}
                      aria-label={`Remove trusted device ${
                        device.deviceName || device.browserSummary || device.id
                      }`}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                style={dangerButtonStyle}
                onClick={() => void handleRevokeAllDevices()}
              >
                Remove all trusted devices
              </button>
            </>
          )}
        </div>
      )}

      {view === 'disable' && (
        <form onSubmit={handleDisable} noValidate>
          <div style={errorStyle} role="alert">
            Disabling two-factor authentication makes your account less secure. Your recovery codes
            and trusted devices will be removed.
          </div>
          <div style={{ marginBottom: '0.9rem', maxWidth: '22rem' }}>
            <label htmlFor="mfa-disable-password" style={labelStyle}>
              Current password
            </label>
            <input
              id="mfa-disable-password"
              type="password"
              autoComplete="current-password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              style={inputStyle}
              required
            />
          </div>
          <div style={{ marginBottom: '0.9rem', maxWidth: '22rem' }}>
            <label htmlFor="mfa-disable-code" style={labelStyle}>
              Authenticator code or recovery code
            </label>
            <input
              id="mfa-disable-code"
              type="text"
              autoComplete="one-time-code"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
              style={inputStyle}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              type="submit"
              style={{ ...primaryButtonStyle, background: '#dc2626' }}
              disabled={pending}
            >
              {pending ? 'Disabling…' : 'Disable two-factor'}
            </button>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={() => {
                resetMessages();
                setDisablePassword('');
                setDisableCode('');
                setView('overview');
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

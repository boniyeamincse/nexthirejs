'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-context';
import { getAdminSettings, getAdminSettingsGroup, updateAdminSettingsGroup } from '@/lib/api-client';
import dashboardStyles from '@/app/(authenticated)/dashboard/dashboard.module.css';
import Link from 'next/link';

const GROUPS = [
  { key: 'general', label: 'General' },
  { key: 'booking', label: 'Booking' },
  { key: 'payment', label: 'Payment' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'privacy', label: 'Privacy' },
  { key: 'security', label: 'Security' },
];

export default function AdminSettingsPage() {
  const { getAccessToken } = useAuth();
  const [group, setGroup] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<Record<string, any>>({});
  const [original, setOriginal] = useState<Record<string, any>>({});

  const token = getAccessToken();

  async function loadGroup() {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data = await getAdminSettingsGroup(token, group);
      const settings = data.settings || {};
      setForm(JSON.parse(JSON.stringify(settings)));
      setOriginal(JSON.parse(JSON.stringify(settings)));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadGroup(); }, [group]);

  function updateField(path: string[], value: any) {
    setForm((prev: Record<string, any>) => {
      const next = JSON.parse(JSON.stringify(prev));
      let obj = next as Record<string, any>;
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i]!;
        if (!(key in obj)) obj[key] = {};
        obj = obj[key] as Record<string, any>;
      }
      const lastKey = path[path.length - 1]!;
      obj[lastKey] = value;
      return next;
    });
    setError('');
    setSuccess('');
  }

  function toggleArray(arr: string[], item: string): string[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  function hasChanges(): boolean {
    return JSON.stringify(form) !== JSON.stringify(original);
  }

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const result = await updateAdminSettingsGroup(token, group, form);
      setForm(JSON.parse(JSON.stringify(result.settings || form)));
      setOriginal(JSON.parse(JSON.stringify(result.settings || form)));
      setSuccess('Settings saved successfully.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function renderField(path: string[], label: string, type: 'text' | 'number' | 'boolean' | 'textarea' | 'array' | 'arrayBool' = 'text', opts?: any) {
    let value: any = form;
    for (const p of path) {
      if (value && typeof value === 'object') value = value[p];
      else { value = undefined; break; }
    }

    const id = path.join('.');

    if (type === 'boolean') {
      return (
        <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <label style={{ color: '#f8fafc', fontSize: '0.85rem' }}>{label}</label>
          <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!value} onChange={(e) => updateField(path, e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{
              position: 'absolute', inset: 0, borderRadius: '12px', transition: '0.3s',
              background: value ? '#6366f1' : 'rgba(255,255,255,0.15)',
            }}>
              <span style={{
                position: 'absolute', left: value ? '22px' : '2px', top: '2px', width: '20px', height: '20px',
                borderRadius: '50%', background: '#fff', transition: '0.3s',
              }} />
            </span>
          </label>
        </div>
      );
    }

    if (type === 'number') {
      return (
        <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <label style={{ color: '#f8fafc', fontSize: '0.85rem' }}>{label}</label>
          <input type="number" value={value ?? ''} onChange={(e) => updateField(path, Number(e.target.value))}
            style={{ width: '120px', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f8fafc', fontSize: '0.85rem', textAlign: 'right' }} />
        </div>
      );
    }

    if (type === 'textarea') {
      return (
        <div key={id} style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <label style={{ display: 'block', color: '#f8fafc', fontSize: '0.85rem', marginBottom: '0.35rem' }}>{label}</label>
          <textarea value={value ?? ''} onChange={(e) => updateField(path, e.target.value)} rows={3}
            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f8fafc', fontSize: '0.85rem', resize: 'vertical' }} />
        </div>
      );
    }

    if (type === 'array' && Array.isArray(opts?.items)) {
      return (
        <div key={id} style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <label style={{ display: 'block', color: '#f8fafc', fontSize: '0.85rem', marginBottom: '0.35rem' }}>{label}</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {opts.items.map((item: string) => {
              const selected = Array.isArray(value) && value.includes(item);
              return (
                <button key={item} type="button" onClick={() => updateField(path, selected ? (value || []).filter((x: string) => x !== item) : [...(value || []), item])}
                  style={{
                    padding: '0.3rem 0.75rem', borderRadius: '6px', border: '1px solid', cursor: 'pointer', fontSize: '0.8rem',
                    background: selected ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                    borderColor: selected ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)',
                    color: selected ? '#a5b4fc' : '#94a3b8',
                  }}>
                  {selected ? '✓ ' : ''}{item}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (type === 'arrayBool' && Array.isArray(value)) {
      return (
        <div key={id} style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <label style={{ display: 'block', color: '#f8fafc', fontSize: '0.85rem', marginBottom: '0.35rem' }}>{label}</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {value.map((item: string, i: number) => (
              <label key={i} style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!item} onChange={() => {
                  const next = [...value];
                  next[i] = next[i] ? '' : item;
                  updateField(path.slice(0, -1).concat(path[path.length - 1]!), next);
                }} style={{ accentColor: '#6366f1' }} />
                {item}
              </label>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
        <label style={{ color: '#f8fafc', fontSize: '0.85rem' }}>{label}</label>
        <input type="text" value={value ?? ''} onChange={(e) => updateField(path, e.target.value)}
          style={{ width: '220px', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f8fafc', fontSize: '0.85rem', textAlign: 'right' }} />
      </div>
    );
  }

  function renderGeneral() {
    return (
      <>
        <h3 style={{ color: '#f8fafc', margin: '0 0 1rem', fontSize: '1rem' }}>Branding</h3>
        {renderField(['platformName'], 'Platform Name')}
        {renderField(['platformDescription'], 'Platform Description', 'textarea')}
        {renderField(['contactEmail'], 'Contact Email')}
        {renderField(['contactPhone'], 'Contact Phone')}
        {renderField(['address'], 'Address', 'textarea')}
        <h3 style={{ color: '#f8fafc', margin: '1.5rem 0 1rem', fontSize: '1rem' }}>Social Links</h3>
        {renderField(['socialLinks', 'facebook'], 'Facebook')}
        {renderField(['socialLinks', 'twitter'], 'Twitter')}
        {renderField(['socialLinks', 'linkedin'], 'LinkedIn')}
        {renderField(['socialLinks', 'youtube'], 'YouTube')}
        <h3 style={{ color: '#f8fafc', margin: '1.5rem 0 1rem', fontSize: '1rem' }}>SEO</h3>
        {renderField(['seo', 'metaTags'], 'Meta Tags', 'textarea')}
        {renderField(['seo', 'analyticsId'], 'Analytics ID')}
      </>
    );
  }

  function renderBooking() {
    return (
      <>
        <h3 style={{ color: '#f8fafc', margin: '0 0 1rem', fontSize: '1rem' }}>Cancellation</h3>
        {renderField(['cancellationWindow'], 'Cancellation Window (hours)', 'number')}
        {renderField(['refundPolicy'], 'Refund Policy')}
        {renderField(['disputeWindow'], 'Dispute Window (days)', 'number')}
        <h3 style={{ color: '#f8fafc', margin: '1.5rem 0 1rem', fontSize: '1rem' }}>Reschedule</h3>
        {renderField(['rescheduleWindow'], 'Reschedule Window (hours)', 'number')}
        {renderField(['rescheduleLimit'], 'Reschedule Limit', 'number')}
        {renderField(['noShowPolicy'], 'No-Show Policy')}
        <h3 style={{ color: '#f8fafc', margin: '1.5rem 0 1rem', fontSize: '1rem' }}>Meeting</h3>
        {renderField(['meetingProvider'], 'Meeting Provider')}
        {renderField(['meetingDurationMin'], 'Min Duration (minutes)', 'number')}
        {renderField(['meetingDurationMax'], 'Max Duration (minutes)', 'number')}
      </>
    );
  }

  function renderPayment() {
    return (
      <>
        <h3 style={{ color: '#f8fafc', margin: '0 0 1rem', fontSize: '1rem' }}>Currency</h3>
        {renderField(['defaultCurrency'], 'Default Currency')}
        <h3 style={{ color: '#f8fafc', margin: '1.5rem 0 1rem', fontSize: '1rem' }}>Gateway</h3>
        {renderField(['transactionFee'], 'Transaction Fee (%)', 'number')}
        <h3 style={{ color: '#f8fafc', margin: '1.5rem 0 1rem', fontSize: '1rem' }}>Tax</h3>
        {renderField(['vatRate'], 'VAT/GST Rate (%)', 'number')}
        {renderField(['taxExemptions'], 'Tax Exemptions', 'boolean')}
        <h3 style={{ color: '#f8fafc', margin: '1.5rem 0 1rem', fontSize: '1rem' }}>Invoice</h3>
        {renderField(['invoicePrefix'], 'Invoice Prefix')}
        {renderField(['invoiceNumberFormat'], 'Number Format')}
      </>
    );
  }

  function renderNotifications() {
    const roles = ['candidate', 'expert'];
    const channels = ['email', 'sms', 'push', 'inApp'];
    return (
      <>
        <h3 style={{ color: '#f8fafc', margin: '0 0 1rem', fontSize: '1rem' }}>Default Preferences</h3>
        {roles.map((role) => (
          <div key={role} style={{ marginBottom: '0.75rem' }}>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'capitalize', margin: '0 0 0.35rem' }}>{role}</p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {channels.map((ch) => (
                <label key={ch} style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                  <input type="checkbox"
                    checked={!!form?.defaultPreferences?.[role]?.[ch]}
                    onChange={(e) => updateField(['defaultPreferences', role, ch], e.target.checked)}
                    style={{ accentColor: '#6366f1' }} />
                  {ch}
                </label>
              ))}
            </div>
          </div>
        ))}
        <h3 style={{ color: '#f8fafc', margin: '1.5rem 0 1rem', fontSize: '1rem' }}>Channels</h3>
        {channels.map((ch) => (
          <div key={ch} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <span style={{ color: '#94a3b8', textTransform: 'capitalize', fontSize: '0.85rem' }}>{ch}</span>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Provider: {form?.channels?.[ch]?.provider || '-'}</span>
              <label style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!form?.channels?.[ch]?.enabled}
                  onChange={(e) => updateField(['channels', ch, 'enabled'], e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{
                  position: 'absolute', inset: 0, borderRadius: '10px', transition: '0.3s',
                  background: form?.channels?.[ch]?.enabled ? '#6366f1' : 'rgba(255,255,255,0.15)',
                }}>
                  <span style={{
                    position: 'absolute', left: form?.channels?.[ch]?.enabled ? '18px' : '2px', top: '2px', width: '16px', height: '16px',
                    borderRadius: '50%', background: '#fff', transition: '0.3s',
                  }} />
                </span>
              </label>
            </div>
          </div>
        ))}
        <h3 style={{ color: '#f8fafc', margin: '1.5rem 0 1rem', fontSize: '1rem' }}>Digest</h3>
        {renderField(['digest', 'frequency'], 'Frequency')}
        {renderField(['digest', 'content'], 'Content', 'array', { items: ['new_bookings', 'messages', 'reminders', 'reports'] })}
      </>
    );
  }

  function renderPrivacy() {
    return (
      <>
        <h3 style={{ color: '#f8fafc', margin: '0 0 1rem', fontSize: '1rem' }}>Data Retention</h3>
        {renderField(['dataRetention', 'userData'], 'User Data (days)', 'number')}
        {renderField(['dataRetention', 'transactionData'], 'Transaction Data (days)', 'number')}
        {renderField(['dataRetention', 'logData'], 'Log Data (days)', 'number')}
        <h3 style={{ color: '#f8fafc', margin: '1.5rem 0 1rem', fontSize: '1rem' }}>Consent</h3>
        {renderField(['consentManagement', 'defaultConsents'], 'Default Consents', 'array', { items: ['terms', 'privacy', 'marketing', 'analytics'] })}
        <h3 style={{ color: '#f8fafc', margin: '1.5rem 0 1rem', fontSize: '1rem' }}>GDPR</h3>
        {renderField(['gdpr', 'policyVersion'], 'Policy Version')}
        <h3 style={{ color: '#f8fafc', margin: '1.5rem 0 1rem', fontSize: '1rem' }}>Cookies</h3>
        {renderField(['cookies', 'essential'], 'Essential', 'boolean')}
        {renderField(['cookies', 'functional'], 'Functional', 'boolean')}
        {renderField(['cookies', 'analytics'], 'Analytics', 'boolean')}
        {renderField(['cookies', 'marketing'], 'Marketing', 'boolean')}
      </>
    );
  }

  function renderSecurity() {
    return (
      <>
        <h3 style={{ color: '#f8fafc', margin: '0 0 1rem', fontSize: '1rem' }}>Password Policy</h3>
        {renderField(['password', 'minLength'], 'Minimum Length', 'number')}
        {renderField(['password', 'specialChars'], 'Require Special Characters', 'boolean')}
        {renderField(['password', 'expiryDays'], 'Expiry (days)', 'number')}
        {renderField(['password', 'historyCount'], 'History Count', 'number')}
        <h3 style={{ color: '#f8fafc', margin: '1.5rem 0 1rem', fontSize: '1rem' }}>Session Management</h3>
        {renderField(['session', 'timeoutMinutes'], 'Timeout (minutes)', 'number')}
        {renderField(['session', 'concurrentSessions'], 'Concurrent Sessions', 'number')}
        {renderField(['session', 'rememberMeDays'], 'Remember Me (days)', 'number')}
        <h3 style={{ color: '#f8fafc', margin: '1.5rem 0 1rem', fontSize: '1rem' }}>MFA</h3>
        {renderField(['mfa', 'recoveryCodes'], 'Recovery Codes', 'number')}
        <h3 style={{ color: '#f8fafc', margin: '1.5rem 0 1rem', fontSize: '1rem' }}>IP Restrictions</h3>
        {renderField(['ipRestrictions', 'whitelist'], 'Whitelist')}
        {renderField(['ipRestrictions', 'blocklist'], 'Blocklist')}
        <h3 style={{ color: '#f8fafc', margin: '1.5rem 0 1rem', fontSize: '1rem' }}>Security Headers</h3>
        <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0 0 0.5rem' }}>Configured in server, read-only here.</p>
      </>
    );
  }

  const renderers: Record<string, () => React.ReactNode> = {
    general: renderGeneral,
    booking: renderBooking,
    payment: renderPayment,
    notifications: renderNotifications,
    privacy: renderPrivacy,
    security: renderSecurity,
  };

  return (
    <div className={dashboardStyles.page}>
      <div className={dashboardStyles.bgGlow} />
      <div className={dashboardStyles.container}>
        <div className={dashboardStyles.hero}>
          <Link href="/admin" style={{ display: 'inline-block', marginBottom: '1rem', color: '#a5b4fc', textDecoration: 'none', fontSize: '0.9rem' }}>← Back to Dashboard</Link>
          <h1 className={dashboardStyles.greeting}>Platform Settings</h1>
          <p className={dashboardStyles.statsText}>Configure global platform settings, defaults, and preferences.</p>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}
        {success && <div style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{success}</div>}

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {GROUPS.map((g) => (
            <button key={g.key} onClick={() => setGroup(g.key)}
              style={{
                padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
                background: group === g.key ? '#6366f1' : 'rgba(255,255,255,0.05)', color: group === g.key ? '#fff' : '#94a3b8',
                fontSize: '0.85rem', fontWeight: group === g.key ? 600 : 400,
              }}>{g.label}</button>
          ))}
        </div>

        <div className={dashboardStyles.card}>
          <div className={dashboardStyles.cardHeader}>
            <h2 className={dashboardStyles.cardTitle}>{GROUPS.find((g) => g.key === group)?.label} Settings</h2>
            <div>
              <button onClick={handleSave} disabled={saving || !hasChanges()}
                className={dashboardStyles.retryBtn}
                style={{
                  opacity: saving || !hasChanges() ? 0.5 : 1,
                  cursor: saving || !hasChanges() ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
          <div style={{ padding: '1.5rem' }}>
            {loading ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>Loading settings...</p>
            ) : (
              renderers[group]?.() || <p style={{ color: '#64748b' }}>Unknown settings group.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

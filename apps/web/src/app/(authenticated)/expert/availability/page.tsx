'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-context';
import {
  ApiClientError,
  getMyAvailabilityProfile,
  updateMyAvailabilityProfile,
  getMyWeeklyAvailability,
  setMyWeeklyAvailability,
  getMyAvailabilityOverrides,
  createMyAvailabilityOverride,
  deleteMyAvailabilityOverride,
} from '@/lib/api-client';
import type {
  ExpertAvailabilityProfileResult,
  ExpertWeeklyAvailabilityWindowResult,
  ExpertAvailabilityOverrideResult,
  ExpertAvailabilityOverrideType,
} from '@nexthire/types';
import { EXPERT_AVAILABILITY_OVERRIDE_TYPES, EXPERT_OFFERING_LIMITS } from '@nexthire/constants';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export default function AvailabilityPage() {
  const { getAccessToken, logout, status: authStatus } = useAuth();

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingWeekly, setSavingWeekly] = useState(false);
  const [savingOverride, setSavingOverride] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [timezone, setTimezone] = useState('');
  const [bufferBefore, setBufferBefore] = useState(0);
  const [bufferAfter, setBufferAfter] = useState(0);
  const [minNoticeHours, setMinNoticeHours] = useState(0);
  const [bookingWindowDays, setBookingWindowDays] = useState(30);

  const [weeklyWindows, setWeeklyWindows] = useState<
    { dayOfWeek: number; startLocalTime: string; endLocalTime: string }[][]
  >(DAY_NAMES.map(() => []));

  const [overrides, setOverrides] = useState<ExpertAvailabilityOverrideResult[]>([]);

  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideDate, setOverrideDate] = useState('');
  const [overrideType, setOverrideType] = useState<ExpertAvailabilityOverrideType>('UNAVAILABLE');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideWindows, setOverrideWindows] = useState<
    { startLocalTime: string; endLocalTime: string }[]
  >([]);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setPageError(null);
    try {
      const [profile, weekly, overridesData] = await Promise.all([
        getMyAvailabilityProfile(token).catch(() => null),
        getMyWeeklyAvailability(token).catch(() => null),
        getMyAvailabilityOverrides(token).catch(() => []),
      ]);

      if (profile) {
        setTimezone(profile.timezone);
        setBufferBefore(profile.bufferBeforeMinutes);
        setBufferAfter(profile.bufferAfterMinutes);
        setMinNoticeHours(profile.minimumNoticeHours);
        setBookingWindowDays(profile.bookingWindowDays);
      }

      if (weekly) {
        const windowsByDay: {
          dayOfWeek: number;
          startLocalTime: string;
          endLocalTime: string;
        }[][] = DAY_NAMES.map(() => []);
        for (const w of weekly.windows) {
          const start = minutesToTime(w.startLocalMinutes);
          const end = minutesToTime(w.endLocalMinutes);
          windowsByDay[w.dayOfWeek].push({
            dayOfWeek: w.dayOfWeek,
            startLocalTime: start,
            endLocalTime: end,
          });
        }
        setWeeklyWindows(windowsByDay);
      }

      setOverrides(overridesData);
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        return;
      }
      setPageError('Failed to load availability data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, logout]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      void load();
    } else if (authStatus === 'unauthenticated') {
      setLoading(false);
    }
  }, [authStatus, load]);

  async function handleSaveProfile() {
    const token = getAccessToken();
    if (!token) return;
    setSavingProfile(true);
    setSaveError(null);
    try {
      await updateMyAvailabilityProfile(token, {
        timezone,
        bufferBeforeMinutes: bufferBefore,
        bufferAfterMinutes: bufferAfter,
        minimumNoticeHours: minNoticeHours,
        bookingWindowDays,
      });
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        return;
      }
      setSaveError(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSaveWeekly() {
    const token = getAccessToken();
    if (!token) return;
    setSavingWeekly(true);
    setSaveError(null);
    try {
      const windows = weeklyWindows.flat();
      await setMyWeeklyAvailability(token, { windows });
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        return;
      }
      setSaveError(err instanceof Error ? err.message : 'Failed to save weekly availability.');
    } finally {
      setSavingWeekly(false);
    }
  }

  function addWindow(dayIndex: number) {
    const updated = [...weeklyWindows];
    updated[dayIndex] = [
      ...updated[dayIndex],
      { dayOfWeek: dayIndex, startLocalTime: '09:00', endLocalTime: '10:00' },
    ];
    setWeeklyWindows(updated);
  }

  function removeWindow(dayIndex: number, windowIndex: number) {
    const updated = [...weeklyWindows];
    updated[dayIndex] = updated[dayIndex].filter((_, i) => i !== windowIndex);
    setWeeklyWindows(updated);
  }

  function updateWindow(
    dayIndex: number,
    windowIndex: number,
    field: 'startLocalTime' | 'endLocalTime',
    value: string,
  ) {
    const updated = [...weeklyWindows];
    updated[dayIndex] = updated[dayIndex].map((w, i) =>
      i === windowIndex ? { ...w, [field]: value } : w,
    );
    setWeeklyWindows(updated);
  }

  async function handleAddOverride(e: React.FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setSavingOverride(true);
    setSaveError(null);
    try {
      await createMyAvailabilityOverride(token, {
        localDate: overrideDate,
        type: overrideType,
        reason: overrideReason.trim() || null,
        windows: overrideType === 'CUSTOM_HOURS' ? overrideWindows : undefined,
      });
      setShowOverrideForm(false);
      setOverrideDate('');
      setOverrideType('UNAVAILABLE');
      setOverrideReason('');
      setOverrideWindows([]);
      const overridesData = await getMyAvailabilityOverrides(token);
      setOverrides(overridesData);
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        return;
      }
      setSaveError(err instanceof Error ? err.message : 'Failed to create override.');
    } finally {
      setSavingOverride(false);
    }
  }

  async function handleDeleteOverride(id: string) {
    const token = getAccessToken();
    if (!token) return;
    setSaveError(null);
    try {
      await deleteMyAvailabilityOverride(token, id);
      setOverrides((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        return;
      }
      setSaveError(err instanceof Error ? err.message : 'Failed to delete override.');
    }
  }

  if (authStatus === 'unknown' || authStatus === 'loading' || loading) {
    return <p style={{ color: '#94a3b8' }}>Loading...</p>;
  }

  const inputSx: React.CSSProperties = {
    width: '100%',
    padding: '0.6rem 0.75rem',
    background: '#0f172a',
    color: '#e2e8f0',
    border: '1px solid #334155',
    borderRadius: '0.375rem',
    fontSize: '0.9rem',
    boxSizing: 'border-box',
  };

  const labelSx: React.CSSProperties = {
    display: 'block',
    color: '#cbd5e1',
    fontSize: '0.85rem',
    marginBottom: '0.35rem',
  };

  return (
    <div>
      <h1 style={{ color: '#f1f5f9', fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.35rem' }}>
        Availability
      </h1>
      <p style={{ color: '#94a3b8', margin: '0 0 1.5rem' }}>
        Configure your availability for bookings.
      </p>

      {pageError && (
        <div
          role="alert"
          style={{
            padding: '0.75rem',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            color: '#fca5a5',
          }}
        >
          {pageError}
          <button
            onClick={() => void load()}
            style={{
              marginLeft: '0.5rem',
              background: 'none',
              border: 'none',
              color: '#fca5a5',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {saveError && (
        <div
          role="alert"
          style={{
            padding: '0.75rem',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            color: '#fca5a5',
          }}
        >
          {saveError}
        </div>
      )}

      {/* Profile Settings */}
      <section
        style={{
          padding: '1.25rem',
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        <h2 style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 600, margin: '0 0 1rem' }}>
          Profile Settings
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '480px' }}>
          <div>
            <label style={labelSx}>Timezone</label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="UTC"
              style={inputSx}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={labelSx}>Buffer Before (min)</label>
              <input
                type="number"
                min={EXPERT_OFFERING_LIMITS.BUFFER_MIN}
                max={EXPERT_OFFERING_LIMITS.BUFFER_MAX}
                step={EXPERT_OFFERING_LIMITS.BUFFER_STEP}
                value={bufferBefore}
                onChange={(e) => setBufferBefore(Number(e.target.value))}
                style={inputSx}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelSx}>Buffer After (min)</label>
              <input
                type="number"
                min={EXPERT_OFFERING_LIMITS.BUFFER_MIN}
                max={EXPERT_OFFERING_LIMITS.BUFFER_MAX}
                step={EXPERT_OFFERING_LIMITS.BUFFER_STEP}
                value={bufferAfter}
                onChange={(e) => setBufferAfter(Number(e.target.value))}
                style={inputSx}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={labelSx}>Min Notice (hours)</label>
              <input
                type="number"
                min={EXPERT_OFFERING_LIMITS.MINIMUM_NOTICE_HOURS_MIN}
                max={EXPERT_OFFERING_LIMITS.MINIMUM_NOTICE_HOURS_MAX}
                value={minNoticeHours}
                onChange={(e) => setMinNoticeHours(Number(e.target.value))}
                style={inputSx}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelSx}>Booking Window (days)</label>
              <input
                type="number"
                min={EXPERT_OFFERING_LIMITS.BOOKING_WINDOW_DAYS_MIN}
                max={EXPERT_OFFERING_LIMITS.BOOKING_WINDOW_DAYS_MAX}
                value={bookingWindowDays}
                onChange={(e) => setBookingWindowDays(Number(e.target.value))}
                style={inputSx}
              />
            </div>
          </div>
          <div>
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              style={{
                padding: '0.55rem 1.2rem',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: savingProfile ? 'not-allowed' : 'pointer',
                opacity: savingProfile ? 0.5 : 1,
              }}
            >
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </section>

      {/* Weekly Availability */}
      <section
        style={{
          padding: '1.25rem',
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        <h2 style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 600, margin: '0 0 1rem' }}>
          Weekly Availability
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {DAY_NAMES.map((day, dayIndex) => (
            <div
              key={day}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                paddingBottom: '0.75rem',
                borderBottom: dayIndex < 6 ? '1px solid #334155' : 'none',
              }}
            >
              <div style={{ width: '80px', flexShrink: 0, paddingTop: '0.4rem' }}>
                <span style={{ color: '#cbd5e1', fontSize: '0.88rem', fontWeight: 500 }}>
                  {DAY_ABBR[dayIndex]}
                </span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {weeklyWindows[dayIndex].map((w, wIdx) => (
                  <div key={wIdx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="time"
                      value={w.startLocalTime}
                      onChange={(e) =>
                        updateWindow(dayIndex, wIdx, 'startLocalTime', e.target.value)
                      }
                      style={{ ...inputSx, width: 'auto' }}
                    />
                    <span style={{ color: '#64748b' }}>to</span>
                    <input
                      type="time"
                      value={w.endLocalTime}
                      onChange={(e) => updateWindow(dayIndex, wIdx, 'endLocalTime', e.target.value)}
                      style={{ ...inputSx, width: 'auto' }}
                    />
                    <button
                      onClick={() => removeWindow(dayIndex, wIdx)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: 'transparent',
                        color: '#fca5a5',
                        border: '1px solid rgba(239,68,68,0.4)',
                        borderRadius: '0.25rem',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addWindow(dayIndex)}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '0.25rem 0.75rem',
                    background: 'transparent',
                    color: '#93c5fd',
                    border: '1px solid rgba(37,99,235,0.35)',
                    borderRadius: '0.25rem',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  + Add window
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={handleSaveWeekly}
          disabled={savingWeekly}
          style={{
            marginTop: '1rem',
            padding: '0.55rem 1.2rem',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: savingWeekly ? 'not-allowed' : 'pointer',
            opacity: savingWeekly ? 0.5 : 1,
          }}
        >
          {savingWeekly ? 'Saving...' : 'Save Weekly Availability'}
        </button>
      </section>

      {/* Overrides */}
      <section
        style={{
          padding: '1.25rem',
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '0.75rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <h2 style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
            Overrides
          </h2>
          <button
            onClick={() => setShowOverrideForm(true)}
            style={{
              padding: '0.4rem 0.9rem',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '0.375rem',
              fontWeight: 600,
              fontSize: '0.83rem',
              cursor: 'pointer',
            }}
          >
            Add Override
          </button>
        </div>

        {overrides.length === 0 && !showOverrideForm && (
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>No overrides configured.</p>
        )}

        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}
        >
          {overrides.map((o) => (
            <div
              key={o.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.7rem 0.9rem',
                background: '#0f172a',
                borderRadius: '0.5rem',
                fontSize: '0.88rem',
              }}
            >
              <div>
                <span style={{ color: '#e2e8f0' }}>{o.localDate}</span>
                <span
                  style={{
                    marginLeft: '0.5rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background:
                      o.type === 'UNAVAILABLE' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                    color: o.type === 'UNAVAILABLE' ? '#fca5a5' : '#fcd34d',
                  }}
                >
                  {o.type === 'UNAVAILABLE' ? 'Unavailable' : 'Custom Hours'}
                </span>
                {o.reason && (
                  <span style={{ color: '#94a3b8', marginLeft: '0.5rem' }}>- {o.reason}</span>
                )}
              </div>
              <button
                onClick={() => handleDeleteOverride(o.id)}
                style={{
                  padding: '0.25rem 0.6rem',
                  background: 'transparent',
                  color: '#fca5a5',
                  border: '1px solid rgba(239,68,68,0.4)',
                  borderRadius: '0.25rem',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        {showOverrideForm && (
          <form
            onSubmit={handleAddOverride}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '480px' }}
          >
            <div>
              <label style={labelSx}>Date</label>
              <input
                type="date"
                value={overrideDate}
                onChange={(e) => setOverrideDate(e.target.value)}
                required
                style={inputSx}
              />
            </div>
            <div>
              <label style={labelSx}>Type</label>
              <select
                value={overrideType}
                onChange={(e) => setOverrideType(e.target.value as ExpertAvailabilityOverrideType)}
                style={inputSx}
              >
                {EXPERT_AVAILABILITY_OVERRIDE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t === 'UNAVAILABLE' ? 'Unavailable' : 'Custom Hours'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelSx}>Reason (optional)</label>
              <input
                type="text"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                style={inputSx}
              />
            </div>
            {overrideType === 'CUSTOM_HOURS' && (
              <div>
                <label style={labelSx}>Custom Windows</label>
                {overrideWindows.map((w, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <input
                      type="time"
                      value={w.startLocalTime}
                      onChange={(e) => {
                        const updated = [...overrideWindows];
                        updated[i] = { ...updated[i], startLocalTime: e.target.value };
                        setOverrideWindows(updated);
                      }}
                      style={{ ...inputSx, width: 'auto' }}
                    />
                    <span style={{ color: '#64748b' }}>to</span>
                    <input
                      type="time"
                      value={w.endLocalTime}
                      onChange={(e) => {
                        const updated = [...overrideWindows];
                        updated[i] = { ...updated[i], endLocalTime: e.target.value };
                        setOverrideWindows(updated);
                      }}
                      style={{ ...inputSx, width: 'auto' }}
                    />
                    <button
                      type="button"
                      onClick={() => setOverrideWindows((prev) => prev.filter((_, j) => j !== i))}
                      style={{
                        padding: '0.2rem 0.5rem',
                        background: 'transparent',
                        color: '#fca5a5',
                        border: '1px solid rgba(239,68,68,0.4)',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setOverrideWindows((prev) => [
                      ...prev,
                      { startLocalTime: '09:00', endLocalTime: '10:00' },
                    ])
                  }
                  style={{
                    padding: '0.25rem 0.75rem',
                    background: 'transparent',
                    color: '#93c5fd',
                    border: '1px solid rgba(37,99,235,0.35)',
                    borderRadius: '0.25rem',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  + Add window
                </button>
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="submit"
                disabled={savingOverride}
                style={{
                  padding: '0.55rem 1.2rem',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: savingOverride ? 'not-allowed' : 'pointer',
                  opacity: savingOverride ? 0.5 : 1,
                }}
              >
                {savingOverride ? 'Saving...' : 'Add Override'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOverrideForm(false);
                  setOverrideWindows([]);
                }}
                style={{
                  padding: '0.55rem 1.2rem',
                  background: 'transparent',
                  color: '#cbd5e1',
                  border: '1px solid #475569',
                  borderRadius: '0.5rem',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

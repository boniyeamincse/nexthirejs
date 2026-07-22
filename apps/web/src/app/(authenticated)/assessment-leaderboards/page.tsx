'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../providers/auth-context';
import { getMyLeaderboardSettings, updateMyLeaderboardSettings } from '../../../lib/api-client';
import type { LeaderboardParticipationSettings } from '@nexthire/types';

function LeaderboardsPageInner() {
  const router = useRouter();
  const { getAccessToken, logout, status: authStatus } = useAuth();

  const [settings, setSettings] = useState<LeaderboardParticipationSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [enabled, setEnabled] = useState(false);

  const fetchSettings = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      await logout();
      router.push('/login');
      return;
    }
    setSettingsLoading(true);
    setError(null);
    try {
      const result = await getMyLeaderboardSettings(token);
      setSettings(result);
      setEnabled(result.enabled);
      setDisplayName(result.displayName ?? '');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load settings';
      if (message.includes('401')) {
        await logout();
        router.push('/login');
        return;
      }
      setError(message);
    } finally {
      setSettingsLoading(false);
    }
  }, [getAccessToken, logout, router]);

  useEffect(() => {
    if (authStatus === 'loading') return;
    if (authStatus === 'unauthenticated') {
      router.push('/login');
      return;
    }
    fetchSettings();
  }, [authStatus, fetchSettings, router]);

  const handleToggle = useCallback(async () => {
    if (enabled) {
      setShowDisableConfirm(true);
      return;
    }
    await saveSettings(true, displayName);
  }, [enabled, displayName]);

  const confirmDisable = useCallback(async () => {
    setShowDisableConfirm(false);
    await saveSettings(false, displayName);
  }, [displayName]);

  const saveSettings = useCallback(async (newEnabled: boolean, newDisplayName: string) => {
    const token = getAccessToken();
    if (!token) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const result = await updateMyLeaderboardSettings(token, {
        enabled: newEnabled,
        displayName: newDisplayName || null,
      });
      setSettings(result);
      setEnabled(result.enabled);
      setDisplayName(result.displayName ?? '');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }, [getAccessToken]);

  const handleSaveDisplayName = useCallback(async () => {
    await saveSettings(enabled, displayName);
  }, [enabled, displayName, saveSettings]);

  if (authStatus === 'loading') {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (authStatus === 'unauthenticated') {
    return <div className="p-6 text-center"><Link href="/login" className="text-blue-600 underline">Sign in to view leaderboards</Link></div>;
  }

  if (error && !settings) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-semibold">Error loading settings</p>
          <p className="text-sm mt-1">{error}</p>
          <button onClick={fetchSettings} className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Assessment Leaderboards</h1>

      {/* Settings Card */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Leaderboard Participation</h2>
        <p className="text-sm text-gray-600">
          Only your leaderboard display name, approved avatar, rank, score, and attempt statistics will be shown.
        </p>

        {settingsLoading ? (
          <div className="h-16 bg-gray-100 rounded animate-pulse" />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="lb-toggle" className="font-medium">Enable Leaderboard Visibility</label>
                <p className="text-xs text-gray-500">Your performance will appear on leaderboards</p>
              </div>
              <button
                id="lb-toggle"
                role="switch"
                aria-checked={enabled}
                onClick={handleToggle}
                disabled={saving}
                className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-gray-300'} ${saving ? 'opacity-50' : ''}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : ''}`} />
              </button>
            </div>

            <div>
              <label htmlFor="lb-display-name" className="block font-medium mb-1">Display Name (optional)</label>
              <p className="text-xs text-gray-500 mb-2">2-80 characters. Leave empty to use a safe alias.</p>
              <div className="flex gap-2">
                <input
                  id="lb-display-name"
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  maxLength={80}
                  placeholder="e.g., Security Learner"
                  className="border rounded px-3 py-2 text-sm flex-1"
                  disabled={saving}
                />
                <button
                  onClick={handleSaveDisplayName}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
              {saveError && <p className="text-red-600 text-xs mt-1">{saveError}</p>}
              {saveSuccess && <p className="text-green-600 text-xs mt-1" role="status">Settings saved</p>}
            </div>

            {!enabled && settings?.enabledAt && (
              <p className="text-xs text-gray-400">Previously enabled on {new Date(settings.enabledAt).toLocaleDateString()}</p>
            )}
          </>
        )}
      </div>

      {/* Navigation to Leaderboards */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Available Leaderboards</h2>
        <p className="text-sm text-gray-600 mb-4">
          View how you rank against other candidates. Enable participation above to appear on leaderboards.
        </p>
        <div className="space-y-3">
          <Link href="/assessment-leaderboards/assessments" className="block p-3 border rounded hover:bg-gray-50">
            <p className="font-medium">Assessment Leaderboards</p>
            <p className="text-sm text-gray-500">Ranked by best attempt per assessment</p>
          </Link>
          <Link href="/assessment-leaderboards/categories" className="block p-3 border rounded hover:bg-gray-50">
            <p className="font-medium">Category Leaderboards</p>
            <p className="text-sm text-gray-500">Aggregated performance by category</p>
          </Link>
        </div>
      </div>

      {/* Disable Confirmation */}
      {showDisableConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Confirm disable">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold">Disable Leaderboard Visibility?</h3>
            <p className="text-sm text-gray-600 mt-2">You will be removed from all leaderboards immediately.</p>
            <div className="flex gap-3 mt-4 justify-end">
              <button onClick={() => setShowDisableConfirm(false)} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDisable} className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700">Disable</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AssessmentLeaderboardsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <LeaderboardsPageInner />
    </Suspense>
  );
}

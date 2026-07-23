'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-context';
import {
  ApiClientError,
  getMyExpertWallet,
  initializeMyExpertWallet,
  listMyExpertPayoutAccounts,
  addMyExpertPayoutAccount,
  listMyExpertPayoutRequests,
  requestMyExpertPayout,
} from '@/lib/api-client';
import type {
  ExpertWalletResult,
  ExpertPayoutAccountResult,
  ExpertPayoutRequestResult,
  ExpertPayoutStatus,
} from '@nexthire/types';
import { EXPERT_PAYOUT_ACCOUNT_TYPES } from '@nexthire/constants';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  bank_account: 'Bank account',
  paypal: 'PayPal',
};

const PAYOUT_STATUS_BADGE: Record<ExpertPayoutStatus, { bg: string; text: string }> = {
  PENDING: { bg: 'rgba(245,158,11,0.15)', text: '#fcd34d' },
  PROCESSING: { bg: 'rgba(99,102,241,0.15)', text: '#a5b4fc' },
  COMPLETED: { bg: 'rgba(34,197,94,0.15)', text: '#86efac' },
  FAILED: { bg: 'rgba(239,68,68,0.15)', text: '#fca5a5' },
  CANCELLED: { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' },
};

const cardStyle: React.CSSProperties = {
  padding: '1rem 1.1rem',
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '0.75rem',
};

export default function ExpertWalletPage() {
  const { getAccessToken, logout, status: authStatus } = useAuth();

  const [wallet, setWallet] = useState<ExpertWalletResult | null>(null);
  const [accounts, setAccounts] = useState<ExpertPayoutAccountResult[]>([]);
  const [requests, setRequests] = useState<ExpertPayoutRequestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);

  const [accountHolder, setAccountHolder] = useState('');
  const [accountType, setAccountType] = useState<string>(EXPERT_PAYOUT_ACCOUNT_TYPES[0]);
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [addingAccount, setAddingAccount] = useState(false);

  const [payoutAccountId, setPayoutAccountId] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [requestingPayout, setRequestingPayout] = useState(false);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setPageError(null);
    try {
      const w = await getMyExpertWallet(token);
      setWallet(w);
      if (w) {
        const [acc, req] = await Promise.all([
          listMyExpertPayoutAccounts(token),
          listMyExpertPayoutRequests(token),
        ]);
        setAccounts(acc);
        setRequests(req);
        if (acc.length > 0 && !payoutAccountId) setPayoutAccountId(acc[0]!.id);
      }
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        return;
      }
      setPageError('Failed to load your wallet. Please try again.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAccessToken, logout]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      void load();
    } else if (authStatus === 'unauthenticated') {
      setLoading(false);
    }
  }, [authStatus, load]);

  async function handleInitialize() {
    const token = getAccessToken();
    if (!token) return;
    setInitializing(true);
    setActionError(null);
    try {
      await initializeMyExpertWallet(token);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Failed to initialize wallet.');
    } finally {
      setInitializing(false);
    }
  }

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setAddingAccount(true);
    setActionError(null);
    try {
      await addMyExpertPayoutAccount(token, {
        accountHolder,
        accountType,
        accountNumber,
        routingNumber: routingNumber.trim() || undefined,
      });
      setAccountHolder('');
      setAccountNumber('');
      setRoutingNumber('');
      await load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Failed to add payout account.');
    } finally {
      setAddingAccount(false);
    }
  }

  async function handleRequestPayout(e: React.FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token || !payoutAccountId) return;
    setRequestingPayout(true);
    setActionError(null);
    try {
      await requestMyExpertPayout(token, { payoutAccountId, amount: payoutAmount });
      setPayoutAmount('');
      await load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Failed to request payout.');
    } finally {
      setRequestingPayout(false);
    }
  }

  if (authStatus === 'unknown' || authStatus === 'loading' || loading) {
    return <p style={{ color: '#94a3b8' }}>Loading...</p>;
  }

  return (
    <div>
      <h1 style={{ color: '#f1f5f9', fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.35rem' }}>
        Wallet
      </h1>
      <p style={{ color: '#94a3b8', margin: '0 0 1.25rem' }}>Your earnings and payouts.</p>

      {pageError && (
        <div role="alert" style={{ ...cardStyle, marginBottom: '1rem', color: '#fca5a5' }}>
          {pageError}
        </div>
      )}
      {actionError && (
        <div role="alert" style={{ ...cardStyle, marginBottom: '1rem', color: '#fca5a5' }}>
          {actionError}
        </div>
      )}

      {!wallet ? (
        <div style={cardStyle}>
          <p style={{ margin: '0 0 0.75rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
            You haven&apos;t set up a wallet yet.
          </p>
          <button
            onClick={handleInitialize}
            disabled={initializing}
            style={{
              padding: '0.5rem 1rem',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '0.4rem',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: initializing ? 'not-allowed' : 'pointer',
            }}
          >
            {initializing ? '...' : 'Set up wallet'}
          </button>
        </div>
      ) : (
        <>
          <div
            style={{
              ...cardStyle,
              marginBottom: '1.25rem',
              display: 'flex',
              gap: '2rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.78rem' }}>Balance</p>
              <p
                style={{
                  margin: '0.2rem 0 0',
                  color: '#f1f5f9',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                }}
              >
                {wallet.currency} {wallet.balance}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.78rem' }}>Total earnings</p>
              <p style={{ margin: '0.2rem 0 0', color: '#e2e8f0', fontSize: '1.1rem' }}>
                {wallet.currency} {wallet.totalEarnings}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.78rem' }}>Total paid out</p>
              <p style={{ margin: '0.2rem 0 0', color: '#e2e8f0', fontSize: '1.1rem' }}>
                {wallet.currency} {wallet.totalPayouts}
              </p>
            </div>
          </div>

          <div style={{ ...cardStyle, marginBottom: '1.25rem' }}>
            <h2 style={{ margin: '0 0 0.75rem', color: '#f1f5f9', fontSize: '1.05rem' }}>
              Payout accounts
            </h2>
            {accounts.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>
                No payout accounts yet.
              </p>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                }}
              >
                {accounts.map((acc) => (
                  <div
                    key={acc.id}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '0.4rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span style={{ color: '#e2e8f0' }}>
                      {ACCOUNT_TYPE_LABELS[acc.accountType] ?? acc.accountType} ·{' '}
                      {acc.accountHolder} · {acc.accountNumberMasked}
                    </span>
                    <span style={{ color: acc.isVerified ? '#86efac' : '#fcd34d' }}>
                      {acc.isVerified ? 'Verified' : 'Pending verification'}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <form
              onSubmit={handleAddAccount}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
            >
              <input
                type="text"
                placeholder="Account holder name"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                required
                style={{
                  padding: '0.4rem 0.6rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '0.4rem',
                  color: '#e2e8f0',
                  fontSize: '0.85rem',
                }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  style={{
                    padding: '0.4rem 0.6rem',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '0.4rem',
                    color: '#e2e8f0',
                    fontSize: '0.85rem',
                  }}
                >
                  {EXPERT_PAYOUT_ACCOUNT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {ACCOUNT_TYPE_LABELS[t] ?? t}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Account number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                  style={{
                    flex: 1,
                    padding: '0.4rem 0.6rem',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '0.4rem',
                    color: '#e2e8f0',
                    fontSize: '0.85rem',
                  }}
                />
                {accountType === 'bank_account' && (
                  <input
                    type="text"
                    placeholder="Routing number (optional)"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.4rem 0.6rem',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '0.4rem',
                      color: '#e2e8f0',
                      fontSize: '0.85rem',
                    }}
                  />
                )}
              </div>
              <button
                type="submit"
                disabled={addingAccount}
                style={{
                  alignSelf: 'flex-start',
                  padding: '0.4rem 0.9rem',
                  background: '#334155',
                  color: '#e2e8f0',
                  border: 'none',
                  borderRadius: '0.4rem',
                  fontSize: '0.83rem',
                  cursor: addingAccount ? 'not-allowed' : 'pointer',
                }}
              >
                {addingAccount ? '...' : 'Add payout account'}
              </button>
            </form>
          </div>

          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 0.75rem', color: '#f1f5f9', fontSize: '1.05rem' }}>
              Payout requests
            </h2>
            {requests.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>
                No payout requests yet.
              </p>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                }}
              >
                {requests.map((req) => {
                  const badge = PAYOUT_STATUS_BADGE[req.status];
                  return (
                    <div
                      key={req.id}
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '0.4rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.85rem',
                      }}
                    >
                      <span style={{ color: '#e2e8f0' }}>
                        {wallet.currency} {req.amount} ·{' '}
                        {new Date(req.requestedAt).toLocaleDateString()}
                      </span>
                      <span
                        style={{
                          padding: '0.1rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: badge.bg,
                          color: badge.text,
                        }}
                      >
                        {req.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {accounts.filter((a) => a.isVerified).length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.83rem' }}>
                Add and verify a payout account before requesting a payout.
              </p>
            ) : (
              <form
                onSubmit={handleRequestPayout}
                style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
              >
                <select
                  value={payoutAccountId}
                  onChange={(e) => setPayoutAccountId(e.target.value)}
                  style={{
                    padding: '0.4rem 0.6rem',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '0.4rem',
                    color: '#e2e8f0',
                    fontSize: '0.85rem',
                  }}
                >
                  {accounts
                    .filter((a) => a.isVerified)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {ACCOUNT_TYPE_LABELS[a.accountType] ?? a.accountType} ·{' '}
                        {a.accountNumberMasked}
                      </option>
                    ))}
                </select>
                <input
                  type="text"
                  placeholder="Amount"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  required
                  style={{
                    padding: '0.4rem 0.6rem',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '0.4rem',
                    color: '#e2e8f0',
                    fontSize: '0.85rem',
                    width: '8rem',
                  }}
                />
                <button
                  type="submit"
                  disabled={requestingPayout}
                  style={{
                    padding: '0.4rem 0.9rem',
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.4rem',
                    fontSize: '0.83rem',
                    fontWeight: 600,
                    cursor: requestingPayout ? 'not-allowed' : 'pointer',
                  }}
                >
                  {requestingPayout ? '...' : 'Request payout'}
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}

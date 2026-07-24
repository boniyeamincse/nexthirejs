'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-context';
import {
  getAdminCandidateReportsRegistration,
  getAdminCandidateReportsCompletion,
  getAdminCandidateReportsReadiness,
  getAdminCandidateReportsCountries,
  getAdminCandidateReportsSkills,
  getAdminCandidateReportsExport,
} from '@/lib/api-client';
import dashboardStyles from '@/app/(authenticated)/dashboard/dashboard.module.css';
import Link from 'next/link';

type Tab = 'registration' | 'completion' | 'readiness' | 'countries' | 'skills' | 'export';

export default function AdminCandidateReportsPage() {
  const { getAccessToken } = useAuth();
  const [tab, setTab] = useState<Tab>('registration');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [registration, setRegistration] = useState<any>(null);
  const [completion, setCompletion] = useState<any>(null);
  const [readiness, setReadiness] = useState<any>(null);
  const [countries, setCountries] = useState<any>(null);
  const [skills, setSkills] = useState<any>(null);

  const token = getAccessToken();

  async function loadRegistration() {
    if (!token) return; setLoading(true);
    try { setRegistration(await getAdminCandidateReportsRegistration(token)); }
    catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }

  async function loadCompletion() {
    if (!token) return; setLoading(true);
    try { setCompletion(await getAdminCandidateReportsCompletion(token)); }
    catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }

  async function loadReadiness() {
    if (!token) return; setLoading(true);
    try { setReadiness(await getAdminCandidateReportsReadiness(token)); }
    catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }

  async function loadCountries() {
    if (!token) return; setLoading(true);
    try { setCountries(await getAdminCandidateReportsCountries(token)); }
    catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }

  async function loadSkills() {
    if (!token) return; setLoading(true);
    try { setSkills(await getAdminCandidateReportsSkills(token)); }
    catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }

  useEffect(() => {
    if (tab === 'registration') loadRegistration();
    else if (tab === 'completion') loadCompletion();
    else if (tab === 'readiness') loadReadiness();
    else if (tab === 'countries') loadCountries();
    else if (tab === 'skills') loadSkills();
    else setLoading(false);
  }, [tab]);

  async function handleExport() {
    if (!token) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const data = await getAdminCandidateReportsExport(token);
      const blob = new Blob([data.csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `candidates-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess(`Exported ${data.count} candidates as CSV.`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const TAB_LABELS: Record<Tab, string> = {
    registration: 'Registration Trends',
    completion: 'Profile Completion',
    readiness: 'Readiness',
    countries: 'Countries',
    skills: 'Skills',
    export: 'Export',
  };

  const maxVal = (arr: any[], key: string) => Math.max(...arr.map((i: any) => i[key]), 1);

  return (
    <div className={dashboardStyles.page}>
      <div className={dashboardStyles.bgGlow} />
      <div className={dashboardStyles.container}>
        <div className={dashboardStyles.hero}>
          <Link href="/admin/candidates" style={{ display: 'inline-block', marginBottom: '1rem', color: '#a5b4fc', textDecoration: 'none', fontSize: '0.9rem' }}>← Back to Candidates</Link>
          <h1 className={dashboardStyles.greeting}>Candidate Reports</h1>
          <p className={dashboardStyles.statsText}>Registration trends, profile completion, readiness, and distribution analytics.</p>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}
        {success && <div style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{success}</div>}

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
                background: tab === t ? '#6366f1' : 'rgba(255,255,255,0.05)', color: tab === t ? '#fff' : '#94a3b8',
                fontSize: '0.85rem', fontWeight: tab === t ? 600 : 400,
              }}>{TAB_LABELS[t]}</button>
          ))}
        </div>

        <div className={dashboardStyles.card}>
          <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>{TAB_LABELS[tab]}</h2></div>
          <div style={{ padding: '1.5rem' }}>
            {loading ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>Loading...</p>
            ) : tab === 'registration' && registration ? (
              <>
                <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.85rem' }}>Daily candidate registrations (last 30 days)</p>
                <div style={{ display: 'flex', gap: '2px', alignItems: 'end', height: '200px', overflowX: 'auto', paddingBottom: '1rem' }}>
                  {registration.trends?.map((d: any, i: number) => {
                    const h = Math.max(4, (d.registrations / Math.max(...registration.trends.map((t: any) => t.registrations), 1)) * 180);
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '32px' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.7rem', marginBottom: '0.15rem' }}>{d.registrations}</span>
                        <div style={{ width: '24px', height: `${h}px`, borderRadius: '4px 4px 0 0', background: '#6366f1', opacity: 0.7 }} />
                        <span style={{ color: '#64748b', fontSize: '0.6rem', marginTop: '0.15rem', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>{d.date}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : tab === 'completion' && completion ? (
              <>
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', flex: 1, minWidth: '150px', textAlign: 'center' }}>
                    <p style={{ color: '#a5b4fc', fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.25rem' }}>{completion.averageCompletion}%</p>
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>Average Completion</p>
                  </div>
                  <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(74,222,128,0.1)', flex: 1, minWidth: '150px', textAlign: 'center' }}>
                    <p style={{ color: '#4ade80', fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.25rem' }}>{completion.totalProfiles}</p>
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>Total Profiles</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {completion.completion?.map((b: any, i: number) => {
                    const pct = completion.totalProfiles > 0 ? (b.count / completion.totalProfiles) * 100 : 0;
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ color: '#f8fafc', fontSize: '0.85rem' }}>{b.range}</span>
                          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{b.count} ({pct.toFixed(1)}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', borderRadius: '4px', background: ['#ef4444', '#f59e0b', '#3b82f6', '#a5b4fc', '#4ade80'][i] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : tab === 'readiness' && readiness ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Month</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Getting Started</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Learning</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Developing</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Ready</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readiness.improvement?.map((r: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '0.5rem', color: '#f8fafc', fontWeight: 600 }}>{r.month}</td>
                        <td style={{ padding: '0.5rem', color: '#94a3b8' }}>{r.gettingStarted}</td>
                        <td style={{ padding: '0.5rem', color: '#94a3b8' }}>{r.learning}</td>
                        <td style={{ padding: '0.5rem', color: '#94a3b8' }}>{r.developing}</td>
                        <td style={{ padding: '0.5rem', color: '#4ade80' }}>{r.ready}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : tab === 'countries' && countries ? (
              <>
                <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.85rem' }}>{countries.distribution?.length || 0} countries represented</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {countries.distribution?.map((c: any, i: number) => {
                    const max = maxVal(countries.distribution || [], 'count');
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                          <span style={{ color: '#f8fafc', fontSize: '0.85rem' }}>{c.country}</span>
                          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{c.count}</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                          <div style={{ width: `${(c.count / max) * 100}%`, height: '100%', borderRadius: '3px', background: '#6366f1' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : tab === 'skills' && skills ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>#</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Skill</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Candidates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skills.skills?.map((s: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '0.5rem', color: '#64748b' }}>{i + 1}</td>
                        <td style={{ padding: '0.5rem', color: '#f8fafc' }}>{s.name}</td>
                        <td style={{ padding: '0.5rem', color: '#a5b4fc', fontWeight: 600 }}>{s.count}</td>
                      </tr>
                    ))}
                    {(!skills.skills || skills.skills.length === 0) && (
                      <tr><td colSpan={3} style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>No skill data available.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : tab === 'export' ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>Download candidate data as CSV for external analysis.</p>
                <button onClick={handleExport} disabled={loading}
                  style={{
                    padding: '0.75rem 2rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: '#6366f1', color: '#fff', fontSize: '1rem', fontWeight: 600,
                    opacity: loading ? 0.6 : 1,
                  }}>
                  {loading ? 'Exporting...' : '⬇ Export All Candidates as CSV'}
                </button>
                <p style={{ color: '#64748b', marginTop: '1rem', fontSize: '0.8rem' }}>Includes ID, email, name, status, completion %, CVs, projects, bookings.</p>
              </div>
            ) : (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '1rem' }}>No data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

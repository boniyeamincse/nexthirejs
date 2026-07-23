'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-context';
import { getAdminCandidate, getAdminCandidateProfile } from '@/lib/api-client';
import dashboardStyles from '@/app/(authenticated)/dashboard/dashboard.module.css';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function AdminCandidateDetailPage() {
  const { getAccessToken } = useAuth();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [candidate, setCandidate] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const token = getAccessToken();
      if (!token) return;
      try {
        const [candidateData, profileData] = await Promise.all([
          getAdminCandidate(token, id),
          getAdminCandidateProfile(token, id),
        ]);
        setCandidate(candidateData);
        setProfile(profileData.profile || profileData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) return <div className={dashboardStyles.page}><div className={dashboardStyles.bgGlow} /><div className={dashboardStyles.container}><p style={{ color: '#94a3b8' }}>Loading candidate...</p></div></div>;
  if (!candidate) return <div className={dashboardStyles.page}><div className={dashboardStyles.bgGlow} /><div className={dashboardStyles.container}><p style={{ color: '#ef4444' }}>Candidate not found</p></div></div>;

  const prof = profile || {};

  return (
    <div className={dashboardStyles.page}>
      <div className={dashboardStyles.bgGlow} />
      <div className={dashboardStyles.container}>
        <div className={dashboardStyles.hero}>
          <Link href="/admin/candidates" style={{ color: '#a5b4fc', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '0.5rem' }}>← Back to Candidates</Link>
          <h1 className={dashboardStyles.greeting}>{candidate.fullName || candidate.full_name || candidate.email}</h1>
          <p className={dashboardStyles.statsText}>{candidate.professionalHeadline || prof.professionalHeadline || '-'}</p>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          <div>
            <div className={dashboardStyles.card} style={{ marginBottom: '2rem' }}>
              <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>Profile Information</h2></div>
              <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label style={{ color: '#64748b', fontSize: '0.8rem' }}>Email</label><p style={{ color: '#f8fafc', margin: '0.25rem 0' }}>{candidate.email}</p></div>
                <div><label style={{ color: '#64748b', fontSize: '0.8rem' }}>Status</label><p style={{ color: candidate.status === 'ACTIVE' ? '#4ade80' : '#ef4444', margin: '0.25rem 0' }}>{candidate.status}</p></div>
                <div><label style={{ color: '#64748b', fontSize: '0.8rem' }}>Completion</label><p style={{ color: '#f8fafc', margin: '0.25rem 0' }}>{candidate.completionPercentage ?? candidate.completion_percentage ?? 0}%</p></div>
                <div><label style={{ color: '#64748b', fontSize: '0.8rem' }}>Created</label><p style={{ color: '#94a3b8', margin: '0.25rem 0' }}>{new Date(candidate.createdAt).toLocaleDateString()}</p></div>
              </div>
            </div>

            {prof.skills && prof.skills.length > 0 && (
              <div className={dashboardStyles.card} style={{ marginBottom: '2rem' }}>
                <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>Skills</h2></div>
                <div style={{ padding: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {prof.skills.map((s: any, i: number) => (
                    <span key={s.id || i} style={{ padding: '0.3rem 0.75rem', borderRadius: '6px', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', fontSize: '0.85rem' }}>
                      {s.name || s.skillName} {s.proficiencyLevel ? `(${s.proficiencyLevel})` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {prof.languages && prof.languages.length > 0 && (
              <div className={dashboardStyles.card} style={{ marginBottom: '2rem' }}>
                <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>Languages</h2></div>
                <div style={{ padding: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {prof.languages.map((l: any, i: number) => (
                    <span key={l.id || i} style={{ padding: '0.3rem 0.75rem', borderRadius: '6px', background: 'rgba(34,197,94,0.15)', color: '#4ade80', fontSize: '0.85rem' }}>
                      {l.name || l.languageName} - {l.proficiencyLevel || l.level || 'Beginner'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {prof.education && prof.education.length > 0 && (
              <div className={dashboardStyles.card} style={{ marginBottom: '2rem' }}>
                <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>Education</h2></div>
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {prof.education.map((e: any, i: number) => (
                    <div key={e.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                      <p style={{ margin: 0, color: '#f8fafc', fontWeight: 500 }}>{e.degree || e.degreeName} - {e.institution || e.schoolName}</p>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>{e.fieldOfStudy || e.field || ''} {e.startDate ? `(${new Date(e.startDate).getFullYear()} - ${e.endDate ? new Date(e.endDate).getFullYear() : 'Present'})` : ''}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {prof.workExperience && prof.workExperience.length > 0 && (
              <div className={dashboardStyles.card} style={{ marginBottom: '2rem' }}>
                <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>Work Experience</h2></div>
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {prof.workExperience.map((w: any, i: number) => (
                    <div key={w.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                      <p style={{ margin: 0, color: '#f8fafc', fontWeight: 500 }}>{w.jobTitle || w.title} @ {w.company || w.companyName}</p>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>{w.startDate ? `${new Date(w.startDate).getFullYear()} - ${w.endDate ? new Date(w.endDate).getFullYear() : 'Present'}` : ''}</p>
                      {w.description && <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>{w.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className={dashboardStyles.card} style={{ marginBottom: '2rem' }}>
              <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>Actions</h2></div>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link href={`/admin/candidates/${id}/assessments`} className={dashboardStyles.retryBtn} style={{ textDecoration: 'none', textAlign: 'center' }}>
                  View Assessments
                </Link>
                <Link href={`/admin/candidates/${id}/projects`} className={dashboardStyles.retryBtn} style={{ textDecoration: 'none', textAlign: 'center' }}>
                  View Projects
                </Link>
              </div>
            </div>

            {candidate.activitySummary && (
              <div className={dashboardStyles.card}>
                <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>Activity Summary</h2></div>
                <div style={{ padding: '1.5rem' }}>
                  {Object.entries(candidate.activitySummary).map(([key, val]: [string, any]) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0.5rem 0' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                      <span style={{ color: '#f8fafc' }}>{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

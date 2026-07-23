'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-context';
import { getAdminExpertVerificationDetail, approveAdminExpertVerification, rejectAdminExpertVerification } from '@/lib/api-client';
import dashboardStyles from '@/app/(authenticated)/dashboard/dashboard.module.css';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function AdminExpertVerificationDetailPage() {
  const { getAccessToken } = useAuth();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [application, setApplication] = useState<any>(null);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    async function loadData() {
      const token = getAccessToken();
      if (!token) return;
      try {
        const data = await getAdminExpertVerificationDetail(token, id);
        setApplication(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  async function handleApprove() {
    const token = getAccessToken();
    if (!token) return;
    setError('');
    setSuccess('');
    try {
      await approveAdminExpertVerification(token, id, note || undefined);
      setSuccess('Application approved successfully');
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleReject() {
    if (!reason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }
    const token = getAccessToken();
    if (!token) return;
    setError('');
    setSuccess('');
    try {
      await rejectAdminExpertVerification(token, id, reason);
      setSuccess('Application rejected');
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (loading) return <div className={dashboardStyles.page}><div className={dashboardStyles.bgGlow} /><div className={dashboardStyles.container}><p style={{ color: '#94a3b8' }}>Loading verification detail...</p></div></div>;
  if (!application) return <div className={dashboardStyles.page}><div className={dashboardStyles.bgGlow} /><div className={dashboardStyles.container}><p style={{ color: '#ef4444' }}>Application not found</p></div></div>;

  return (
    <div className={dashboardStyles.page}>
      <div className={dashboardStyles.bgGlow} />
      <div className={dashboardStyles.container}>
        <div className={dashboardStyles.hero}>
          <Link href="/admin/experts/verification" style={{ color: '#a5b4fc', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '0.5rem' }}>← Back to Verification Queue</Link>
          <h1 className={dashboardStyles.greeting}>Verification Application</h1>
          <p className={dashboardStyles.statsText}>{application.user?.email || application.email}</p>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}
        {success && <div style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{success}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          <div>
            <div className={dashboardStyles.card} style={{ marginBottom: '2rem' }}>
              <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>Application Details</h2></div>
              <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label style={{ color: '#64748b', fontSize: '0.8rem' }}>Email</label><p style={{ color: '#f8fafc', margin: '0.25rem 0' }}>{application.user?.email || application.email}</p></div>
                <div><label style={{ color: '#64748b', fontSize: '0.8rem' }}>Professional Title</label><p style={{ color: '#f8fafc', margin: '0.25rem 0' }}>{application.professionalTitle || application.professional_title || '-'}</p></div>
                <div><label style={{ color: '#64748b', fontSize: '0.8rem' }}>Status</label><p style={{ color: application.status === 'APPROVED' ? '#4ade80' : application.status === 'REJECTED' ? '#ef4444' : '#fbbf24', margin: '0.25rem 0' }}>{application.status}</p></div>
                <div><label style={{ color: '#64748b', fontSize: '0.8rem' }}>Submitted</label><p style={{ color: '#94a3b8', margin: '0.25rem 0' }}>{new Date(application.createdAt || application.submittedAt).toLocaleDateString()}</p></div>
              </div>
            </div>

            {application.bio && (
              <div className={dashboardStyles.card} style={{ marginBottom: '2rem' }}>
                <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>Bio</h2></div>
                <div style={{ padding: '1.5rem' }}>
                  <p style={{ color: '#94a3b8', margin: 0, lineHeight: '1.6' }}>{application.bio}</p>
                </div>
              </div>
            )}

            {application.documents && application.documents.length > 0 && (
              <div className={dashboardStyles.card} style={{ marginBottom: '2rem' }}>
                <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>Documents</h2></div>
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {application.documents.map((doc: any, i: number) => (
                    <div key={doc.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ color: '#f8fafc' }}>{doc.name || doc.fileName || `Document ${i + 1}`}</span>
                      {doc.url && (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className={dashboardStyles.retryBtn} style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', textDecoration: 'none' }}>
                          View
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {application.additionalInfo && (
              <div className={dashboardStyles.card} style={{ marginBottom: '2rem' }}>
                <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>Additional Information</h2></div>
                <div style={{ padding: '1.5rem' }}>
                  <p style={{ color: '#94a3b8', margin: 0, whiteSpace: 'pre-wrap' }}>{typeof application.additionalInfo === 'string' ? application.additionalInfo : JSON.stringify(application.additionalInfo, null, 2)}</p>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className={dashboardStyles.card} style={{ marginBottom: '2rem' }}>
              <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>Approve Application</h2></div>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <textarea
                  placeholder="Approval note (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f8fafc', resize: 'vertical', fontFamily: 'inherit' }}
                />
                <button onClick={handleApprove} className={dashboardStyles.retryBtn} style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}>
                  Approve
                </button>
              </div>
            </div>

            <div className={dashboardStyles.card}>
              <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>Reject Application</h2></div>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <textarea
                  placeholder="Rejection reason (required)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f8fafc', resize: 'vertical', fontFamily: 'inherit' }}
                />
                <button onClick={handleReject} className={dashboardStyles.retryBtn} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

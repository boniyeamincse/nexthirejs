'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-context';
import { getAdminExpert, getAdminExpertServices, getAdminExpertBookings } from '@/lib/api-client';
import dashboardStyles from '@/app/(authenticated)/dashboard/dashboard.module.css';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function AdminExpertDetailPage() {
  const { getAccessToken } = useAuth();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expert, setExpert] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const token = getAccessToken();
      if (!token) return;
      try {
        const [expertData, servicesData, bookingsData] = await Promise.all([
          getAdminExpert(token, id),
          getAdminExpertServices(token, id),
          getAdminExpertBookings(token, id),
        ]);
        setExpert(expertData);
        setServices(servicesData.services || servicesData || []);
        setBookings(bookingsData.bookings || bookingsData || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) return <div className={dashboardStyles.page}><div className={dashboardStyles.bgGlow} /><div className={dashboardStyles.container}><p style={{ color: '#94a3b8' }}>Loading expert...</p></div></div>;
  if (!expert) return <div className={dashboardStyles.page}><div className={dashboardStyles.bgGlow} /><div className={dashboardStyles.container}><p style={{ color: '#ef4444' }}>Expert not found</p></div></div>;

  return (
    <div className={dashboardStyles.page}>
      <div className={dashboardStyles.bgGlow} />
      <div className={dashboardStyles.container}>
        <div className={dashboardStyles.hero}>
          <Link href="/admin/experts" style={{ color: '#a5b4fc', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '0.5rem' }}>← Back to Experts</Link>
          <h1 className={dashboardStyles.greeting}>{expert.fullName || expert.full_name || expert.email}</h1>
          <p className={dashboardStyles.statsText}>{expert.professionalTitle || expert.professional_title || '-'}</p>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          <div>
            <div className={dashboardStyles.card} style={{ marginBottom: '2rem' }}>
              <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>Professional Information</h2></div>
              <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label style={{ color: '#64748b', fontSize: '0.8rem' }}>Email</label><p style={{ color: '#f8fafc', margin: '0.25rem 0' }}>{expert.email}</p></div>
                <div><label style={{ color: '#64748b', fontSize: '0.8rem' }}>Phone</label><p style={{ color: '#f8fafc', margin: '0.25rem 0' }}>{expert.phone || expert.phoneNumber || '-'}</p></div>
                <div><label style={{ color: '#64748b', fontSize: '0.8rem' }}>Professional Title</label><p style={{ color: '#f8fafc', margin: '0.25rem 0' }}>{expert.professionalTitle || expert.professional_title || '-'}</p></div>
                <div><label style={{ color: '#64748b', fontSize: '0.8rem' }}>Experience</label><p style={{ color: '#f8fafc', margin: '0.25rem 0' }}>{expert.yearsOfExperience ?? expert.years_of_experience ?? 0} years</p></div>
                <div><label style={{ color: '#64748b', fontSize: '0.8rem' }}>Status</label><p style={{ color: expert.status === 'ACTIVE' ? '#4ade80' : '#ef4444', margin: '0.25rem 0' }}>{expert.status}</p></div>
                <div><label style={{ color: '#64748b', fontSize: '0.8rem' }}>Created</label><p style={{ color: '#94a3b8', margin: '0.25rem 0' }}>{new Date(expert.createdAt).toLocaleDateString()}</p></div>
              </div>
            </div>

            {services.length > 0 && (
              <div className={dashboardStyles.card} style={{ marginBottom: '2rem' }}>
                <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>Services</h2></div>
                <div style={{ padding: '1.5rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Title</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Price</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.map((s: any) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '0.5rem', color: '#f8fafc' }}>{s.title || s.name}</td>
                          <td style={{ padding: '0.5rem', color: '#4ade80' }}>{s.price ? `$${s.price}` : '-'}</td>
                          <td style={{ padding: '0.5rem' }}>
                            <span style={{ color: s.isActive ? '#4ade80' : '#ef4444' }}>{s.isActive ? 'Active' : 'Inactive'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {bookings.length > 0 && (
              <div className={dashboardStyles.card} style={{ marginBottom: '2rem' }}>
                <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>Recent Bookings</h2></div>
                <div style={{ padding: '1.5rem' }}>
                  {bookings.map((b: any) => (
                    <div key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0.75rem 0' }}>
                      <p style={{ margin: 0, color: '#f8fafc' }}>{b.serviceName || b.service?.title || 'Booking'}</p>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
                        {b.status} - {b.startTime ? new Date(b.startTime).toLocaleDateString() : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className={dashboardStyles.card}>
              <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>Contact Info</h2></div>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ color: '#64748b', fontSize: '0.8rem' }}>Email</label>
                  <p style={{ color: '#f8fafc', margin: '0.25rem 0' }}>{expert.email}</p>
                </div>
                {expert.phone && (
                  <div>
                    <label style={{ color: '#64748b', fontSize: '0.8rem' }}>Phone</label>
                    <p style={{ color: '#f8fafc', margin: '0.25rem 0' }}>{expert.phone}</p>
                  </div>
                )}
                {expert.location && (
                  <div>
                    <label style={{ color: '#64748b', fontSize: '0.8rem' }}>Location</label>
                    <p style={{ color: '#f8fafc', margin: '0.25rem 0' }}>{expert.location}</p>
                  </div>
                )}
                {expert.linkedInUrl && (
                  <div>
                    <label style={{ color: '#64748b', fontSize: '0.8rem' }}>LinkedIn</label>
                    <p style={{ color: '#a5b4fc', margin: '0.25rem 0', fontSize: '0.85rem' }}>{expert.linkedInUrl}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

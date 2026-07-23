'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import styles from '@/app/(auth)/auth.module.css';

interface PassportSection {
  id: string;
  type: string;
  title: string;
  content?: any;
}

interface PassportData {
  id: string;
  userId: string;
  status: string;
  publicProfile: boolean;
  headline?: string;
  summary?: string;
  viewCount: number;
  sections: PassportSection[];
}

export default function PublicPassportPage() {
  const params = useParams();
  const userId = params.userId as string;

  const [passport, setPassport] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function recordView() {
      try {
        await fetch(`http://localhost:3001/api/v1/passport/public/${passport?.id}/view`, {
          method: 'POST',
        });
      } catch (err) {
        console.error('Failed to record view:', err);
      }
    }

    if (passport?.id) {
      recordView();
    }
  }, [passport?.id]);

  useEffect(() => {
    async function loadPassport() {
      try {
        const res = await fetch(`http://localhost:3001/api/v1/passport/public/${userId}`);

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Passport not found');
          }
          throw new Error('Failed to load passport');
        }

        const data = await res.json();
        setPassport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading passport');
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      loadPassport();
    }
  }, [userId]);

  if (loading) {
    return <div className={styles.container}>Loading...</div>;
  }

  if (!passport || error) {
    return (
      <div className={styles.container}>
        <h1>Not Found</h1>
        <p>{error || 'This passport is not available'}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '40px 20px',
            borderRadius: '8px',
            marginBottom: '30px',
            textAlign: 'center',
          }}
        >
          <h1 style={{ margin: '0 0 10px 0' }}>{passport.headline || 'Professional Profile'}</h1>
          {passport.summary && <p style={{ margin: 0, opacity: 0.9 }}>{passport.summary}</p>}
          <div style={{ marginTop: '20px', fontSize: '14px', opacity: 0.8 }}>
            👁️ {passport.viewCount} views
          </div>
        </div>

        {passport.sections.length > 0 ? (
          <div>
            <h2>Profile Sections</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px',
              }}
            >
              {passport.sections.map((section) => (
                <div
                  key={section.id}
                  style={{
                    background: '#f9f9f9',
                    padding: '20px',
                    borderRadius: '8px',
                    borderLeft: '4px solid #667eea',
                  }}
                >
                  <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{section.title}</h3>
                  {section.type === 'SKILLS' && (
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                      Skills and expertise
                    </p>
                  )}
                  {section.type === 'PROJECTS' && (
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Project portfolio</p>
                  )}
                  {section.type === 'ACHIEVEMENTS' && (
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                      Achievements and awards
                    </p>
                  )}
                  {section.content && (
                    <div
                      style={{
                        marginTop: '10px',
                        color: '#333',
                        fontSize: '14px',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {typeof section.content === 'string'
                        ? section.content
                        : JSON.stringify(section.content, null, 2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#666' }}>No sections shared yet</p>
        )}
      </div>
    </div>
  );
}

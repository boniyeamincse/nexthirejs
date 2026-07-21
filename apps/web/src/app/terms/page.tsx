import Link from 'next/link';
import styles from '../(auth)/auth.module.css';

export default function TermsPage() {
  return (
    <div className={styles.container}>
      <div className={styles.background}></div>
      <div className={styles.glassCard} style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <div className={styles.header} style={{ marginBottom: '2.5rem', textAlign: 'left' }}>
          <h1 className={styles.title} style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            Terms and Conditions
          </h1>
          <p className={styles.subtitle} style={{ fontSize: '1.1rem' }}>
            Last updated: July 2026
          </p>
        </div>

        <div style={{ color: '#cbd5e1', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '1.5rem', fontSize: '0.95rem' }}>
          <section>
            <h2 style={{ color: '#f8fafc', fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 600 }}>1. Acceptance of Terms</h2>
            <p>By accessing and using NextHire, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our platform.</p>
          </section>

          <section>
            <h2 style={{ color: '#f8fafc', fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 600 }}>2. Platform Usage</h2>
            <p>NextHire grants you a personal, non-exclusive, non-transferable license to use our platform for career readiness, learning, and job hunting. You agree not to misuse our services or help anyone else do so.</p>
          </section>

          <section>
            <h2 style={{ color: '#f8fafc', fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 600 }}>3. User Content</h2>
            <p>You retain your rights to any content you submit, post, or display on NextHire (such as your resume or mock interview recordings). By submitting content, you grant NextHire a license to use, host, and display that content in connection with providing the services to you.</p>
          </section>

          <section>
            <h2 style={{ color: '#f8fafc', fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 600 }}>4. Termination</h2>
            <p>We may suspend or terminate your access to NextHire if you violate these Terms or for any other reason, at our sole discretion, without prior notice or liability.</p>
          </section>

          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '0.85rem' }}>
              Note: These are demo terms and conditions for the NextHire platform preview.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <Link href="/" className={styles.submitButton} style={{ textDecoration: 'none', display: 'inline-block', padding: '0.75rem 2rem' }}>
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

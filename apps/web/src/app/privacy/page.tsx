import Link from 'next/link';
import styles from '../(auth)/auth.module.css';

export default function PrivacyPolicyPage() {
  return (
    <div className={styles.container}>
      <div className={styles.background}></div>
      <div className={styles.glassCard} style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <div className={styles.header} style={{ marginBottom: '2.5rem', textAlign: 'left' }}>
          <h1 className={styles.title} style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            Privacy Policy
          </h1>
          <p className={styles.subtitle} style={{ fontSize: '1.1rem' }}>
            Last updated: July 2026
          </p>
        </div>

        <div style={{ color: '#cbd5e1', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '1.5rem', fontSize: '0.95rem' }}>
          <section>
            <h2 style={{ color: '#f8fafc', fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 600 }}>1. Information We Collect</h2>
            <p>At NextHire, we collect information that you provide directly to us when creating an account, building your career profile, and using our mock interview tools. This may include your name, email address, educational background, and audio/video recordings during practice sessions.</p>
          </section>

          <section>
            <h2 style={{ color: '#f8fafc', fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 600 }}>2. How We Use Your Information</h2>
            <p>We use the information we collect to provide, maintain, and improve our services. Your data powers your personalized learning path and helps us connect you with potential employers when you choose to share your Career Passport.</p>
          </section>

          <section>
            <h2 style={{ color: '#f8fafc', fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 600 }}>3. Information Sharing and Disclosure</h2>
            <p>We do not share your personal information with companies, organizations, or individuals outside of NextHire except in the following cases: with your explicit consent (such as applying to a company), for legal reasons, or with trusted service providers acting on our behalf.</p>
          </section>

          <section>
            <h2 style={{ color: '#f8fafc', fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 600 }}>4. Data Security</h2>
            <p>We use industry-standard security measures, including end-to-end encryption and comprehensive audit logging, to protect your personal information from unauthorized access, alteration, disclosure, or destruction.</p>
          </section>

          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '0.85rem' }}>
              Note: This is a demo privacy policy for the NextHire platform preview.
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

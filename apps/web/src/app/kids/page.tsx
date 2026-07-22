import Link from 'next/link';
import styles from '../(auth)/auth.module.css';

export default function KidsPage() {
  return (
    <div className={styles.container}>
      <div className={styles.background}></div>
      <div className={styles.glassCard} style={{ textAlign: 'center', padding: '4rem 2.5rem' }}>
        <div className={styles.header} style={{ marginBottom: '1.5rem' }}>
          <h1 className={styles.title} style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            NextHire for Kids
          </h1>
          <p className={styles.subtitle} style={{ fontSize: '1.1rem' }}>
            Start building communication skills early with fun, interactive learning.
          </p>
        </div>

        <div
          style={{
            display: 'inline-block',
            background: 'rgba(99, 102, 241, 0.2)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            color: '#a5b4fc',
            padding: '0.5rem 1.25rem',
            borderRadius: '9999px',
            fontWeight: 600,
            fontSize: '0.9rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: '2rem',
          }}
        >
          Coming Soon
        </div>

        <p className={styles.subtitle} style={{ marginBottom: '2.5rem' }}>
          Our specialized curriculum for younger learners is currently under development.
        </p>

        <Link
          href="/"
          className={styles.submitButton}
          style={{ textDecoration: 'none', display: 'inline-block', padding: '0.75rem 2rem' }}
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}

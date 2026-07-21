import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}></div>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Learn, Practise, Prove, <br /> and Get Hired.
          </h1>
          <p className={styles.heroSubtitle}>
            NextHire is the ultimate ecosystem for your career. Build your verified portfolio,
            practise with expert trainers in live mock interviews, and get discovered by top
            companies.
          </p>
          <div className={styles.buttonGroup}>
            <Link href="/register" className={styles.primaryButton}>
              Start Your Career Journey
            </Link>
            <Link href="/status" className={styles.secondaryButton}>
              Explore Platform
            </Link>
          </div>
        </div>

        <div className={styles.mockupContainer}>
          <Image
            src="/images/mock-interview-mockup.png"
            alt="NextHire Career Passport and Mock Interview Interface"
            width={1100}
            height={660}
            className={styles.mockupImage}
            priority
          />
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.featuresHeader}>
          <h2 className={styles.featuresTitle}>One Platform, Complete Ecosystem</h2>
          <p className={styles.featuresSubtitle}>
            Whether you are building your career, sharing your expertise, or hiring top talent.
          </p>
        </div>

        <div className={styles.featureSection}>
          <h3 className={styles.featureSectionTitle}>For Candidates</h3>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📚</div>
              <h3 className={styles.featureCardTitle}>Structured Learning Paths</h3>
              <p className={styles.featureCardDesc}>
                Follow tailored curriculum tracks, complete courses, and pass quizzes to build
                verified skills on your profile.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🎤</div>
              <h3 className={styles.featureCardTitle}>Live Mock Interviews</h3>
              <p className={styles.featureCardDesc}>
                Book 1-on-1 sessions with industry experts to practice behavioral and technical
                questions with real-time feedback.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🛡️</div>
              <h3 className={styles.featureCardTitle}>Career Passport</h3>
              <p className={styles.featureCardDesc}>
                Build a stunning, verified portfolio including your CV, project history, and trainer
                evaluations to share with employers.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.featureSection}>
          <h3 className={styles.featureSectionTitle}>For Trainers & Companies</h3>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>💼</div>
              <h3 className={styles.featureCardTitle}>Expert Hiring (Companies)</h3>
              <p className={styles.featureCardDesc}>
                Stop guessing. Search and recruit verified candidates with proven assessments and
                project portfolios directly.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🎓</div>
              <h3 className={styles.featureCardTitle}>Monetize Expertise (Trainers)</h3>
              <p className={styles.featureCardDesc}>
                Conduct CV reviews, host live mentoring sessions, and rate technical assessments to
                earn on your schedule.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to transform your career?</h2>
          <p className={styles.ctaSubtitle}>
            Join the NextHire community and connect with experts and companies today.
          </p>
          <Link href="/register" className={styles.primaryButton}>
            Join NextHire Free
          </Link>
        </div>
      </section>
    </div>
  );
}

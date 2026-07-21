import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import styles from './footer.module.css';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.topSection}>
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>About</h3>
            <ul className={styles.nav}>
              <li><Link href="/help" className={styles.navItem}>Help center</Link></li>
              <li><Link href="/careers" className={styles.navItem}>Careers</Link></li>
              <li><Link href="/press" className={styles.navItem}>Press</Link></li>
            </ul>
          </div>

          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Join</h3>
            <ul className={styles.nav}>
              <li><Link href="/pro" className={styles.navItem}>NextHire Pro</Link></li>
              <li><Link href="/kids" className={styles.navItem}>NextHire for kids</Link></li>
              <li><Link href="/business" className={styles.navItem}>NextHire for business</Link></li>
              <li><Link href="/become-tutor" className={styles.navItem}>Become a trainer</Link></li>
              <li><Link href="/ambassador" className={styles.navItem}>Become an ambassador</Link></li>
            </ul>
          </div>

          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Other</h3>
            <ul className={styles.nav}>
              <li><Link href="/privacy" className={styles.navItem}>Privacy policy</Link></li>
              <li><Link href="/terms" className={styles.navItem}>Terms and conditions</Link></li>
            </ul>
          </div>

          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Social</h3>
            <ul className={styles.nav}>
              <li><a href="https://instagram.com" target="_blank" rel="noreferrer" className={styles.navItem}>Instagram</a></li>
              <li><a href="https://facebook.com" target="_blank" rel="noreferrer" className={styles.navItem}>Facebook</a></li>
              <li><a href="https://youtube.com" target="_blank" rel="noreferrer" className={styles.navItem}>Youtube</a></li>
              <li><a href="https://twitter.com" target="_blank" rel="noreferrer" className={styles.navItem}>Twitter</a></li>
            </ul>
          </div>

          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Get the App</h3>
            <div className={styles.appBadges}>
              <a href="#" className={styles.badge}>
                <span>🍎</span> App Store
              </a>
              <a href="#" className={styles.badge}>
                <span>▶️</span> Google Play
              </a>
            </div>
          </div>
        </div>

        <div className={styles.bottomSection}>
          <div className={styles.brand}>
            <p className={styles.logo}>{siteConfig.name}</p>
          </div>
          <p className={styles.copyright}>
            &copy; {year} {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

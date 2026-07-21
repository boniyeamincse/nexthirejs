import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import styles from './header.module.css';

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <nav
        className={styles.nav}
        aria-label="Main navigation"
      >
        <Link href="/" className={styles.logo}>
          {siteConfig.name}
        </Link>
        <ul className={styles.navList}>
          {siteConfig.primaryNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={styles.navItem}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className={styles.authGroup}>
          <Link href="/login" className={styles.loginBtn}>
            Log In
          </Link>
          <Link href="/register" className={styles.registerBtn}>
            Register
          </Link>
        </div>
      </nav>
    </header>
  );
}

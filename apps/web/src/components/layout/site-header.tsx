'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { siteConfig } from '@/lib/site-config';
import { useAuth } from '@/providers/auth-context';
import { fetchMyPhotoObjectUrl } from '@/lib/api-client';
import styles from './header.module.css';

export function SiteHeader() {
  const { status, logout, user, getAccessToken } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    router.push('/');
    setMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadAvatar = useCallback(async (token: string) => {
    try {
      const url = await fetchMyPhotoObjectUrl(token);
      setAvatarUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (e) {
      // Photo might not exist
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      const token = getAccessToken();
      if (token) {
        void loadAvatar(token);
      }
    }
  }, [status, getAccessToken, loadAvatar]);

  useEffect(() => {
    return () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    };
  }, [avatarUrl]);

  const displayName = user?.email ? (user.email.split('@')[0] ?? 'User') : 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="Main navigation">
        <Link href="/" className={styles.logo}>
          {siteConfig.name}
        </Link>
        <ul className={styles.navList}>
          {siteConfig.primaryNav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={styles.navItem}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className={styles.authGroup}>
          {
            status === 'authenticated' ? (
              <>
                <button aria-label="Notifications" className={styles.bellIcon}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                </button>

                <Link href="/pro" className={styles.tryProBtn}>
                  Try Pro
                </Link>

                <div
                  className={styles.profileMenuContainer}
                  ref={menuRef}
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-expanded={menuOpen}
                >
                  <div
                    className={styles.headerAvatar}
                    style={
                      avatarUrl
                        ? {
                            backgroundImage: `url(${avatarUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            color: 'transparent',
                          }
                        : undefined
                    }
                  >
                    {avatarUrl ? null : initial}
                  </div>
                  <svg
                    className={styles.dropdownArrow}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>

                  {menuOpen && (
                    <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                      <div className={styles.dropdownHeader}>
                        <p className={styles.dropdownName}>{displayName}</p>
                        <p className={styles.dropdownEmail}>{user?.email}</p>
                      </div>
                      <ul className={styles.dropdownList}>
                        <li>
                          <Link
                            href="/dashboard"
                            className={styles.dropdownItem}
                            onClick={() => setMenuOpen(false)}
                          >
                            <svg
                              className={styles.dropdownIcon}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect x="3" y="3" width="7" height="7"></rect>
                              <rect x="14" y="3" width="7" height="7"></rect>
                              <rect x="14" y="14" width="7" height="7"></rect>
                              <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                            My Dashboard
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/profile"
                            className={styles.dropdownItem}
                            onClick={() => setMenuOpen(false)}
                          >
                            <svg
                              className={styles.dropdownIcon}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            Profile
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/settings"
                            className={styles.dropdownItem}
                            onClick={() => setMenuOpen(false)}
                          >
                            <svg
                              className={styles.dropdownIcon}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="3"></circle>
                              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                            Settings
                          </Link>
                        </li>
                        <li
                          className={`${styles.dropdownItem} ${styles.signOutItem}`}
                          onClick={() => void handleLogout()}
                        >
                          <svg
                            className={styles.dropdownIcon}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                          </svg>
                          Sign Out
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </>
            ) : status === 'unauthenticated' ? (
              <>
                <Link href="/login" className={styles.loginBtn}>
                  Log In
                </Link>
                <Link href="/register" className={styles.registerBtn}>
                  Register
                </Link>
              </>
            ) : null /* Do not show login/register buttons while loading */
          }
        </div>
      </nav>
    </header>
  );
}

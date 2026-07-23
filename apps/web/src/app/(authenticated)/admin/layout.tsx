'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './admin.module.css';

const sections = [
  {
    title: 'Dashboard',
    links: [
      { label: 'Platform Overview', href: '/admin', icon: '📊' },
      { label: 'Growth Analytics', href: '/admin/analytics/growth', icon: '📈' },
      { label: 'Revenue Analytics', href: '/admin/analytics/revenue', icon: '💰' },
      { label: 'Performance', href: '/admin/analytics/performance', icon: '⚡' },
    ],
  },
  {
    title: 'User Management',
    links: [
      { label: 'All Users', href: '/admin/users', icon: '👥' },
      { label: 'Suspended Accounts', href: '/admin/users/suspended', icon: '🚫' },
      { label: 'Account Verification', href: '/admin/users/verification', icon: '✅' },
      { label: 'Roles & Permissions', href: '/admin/roles', icon: '🔐' },
    ],
  },
  {
    title: 'Candidates',
    links: [
      { label: 'All Candidates', href: '/admin/candidates', icon: '🎓' },
      { label: 'Skill Verification', href: '/admin/candidates/skills', icon: '🛠️' },
      { label: 'Readiness Levels', href: '/admin/candidates/readiness', icon: '📋' },
      { label: 'Candidate Reports', href: '/admin/candidates/reports', icon: '📑' },
    ],
  },
  {
    title: 'Experts',
    links: [
      { label: 'All Experts', href: '/admin/experts', icon: '🎯' },
      { label: 'Verification Queue', href: '/admin/experts/verification', icon: '🔍' },
      { label: 'Performance', href: '/admin/experts/performance', icon: '📊' },
      { label: 'Complaints', href: '/admin/experts/complaints', icon: '⚠️' },
      { label: 'Expert Reports', href: '/admin/experts/reports', icon: '📄' },
    ],
  },
  {
    title: 'Companies',
    links: [
      { label: 'All Companies', href: '/admin/companies', icon: '🏢' },
      { label: 'Verification Queue', href: '/admin/companies/verification', icon: '🔍' },
      { label: 'Subscriptions', href: '/admin/companies/subscriptions', icon: '💳' },
      { label: 'Company Activity', href: '/admin/companies/activity', icon: '📊' },
    ],
  },
  {
    title: 'Jobs',
    links: [
      { label: 'All Jobs', href: '/admin/jobs', icon: '💼' },
      { label: 'Moderation Queue', href: '/admin/jobs/pending', icon: '📝' },
      { label: 'Reported Jobs', href: '/admin/jobs/reported', icon: '🚩' },
      { label: 'Job Analytics', href: '/admin/jobs/analytics', icon: '📈' },
      { label: 'Job Categories', href: '/admin/jobs/categories', icon: '📂' },
    ],
  },
  {
    title: 'Assessments',
    links: [
      { label: 'All Assessments', href: '/admin/assessments', icon: '📝' },
      { label: 'Create Assessment', href: '/admin/assessments/create', icon: '➕' },
      { label: 'Question Bank', href: '/admin/assessments/questions', icon: '❓' },
      { label: 'Results', href: '/admin/assessments/results', icon: '📊' },
      { label: 'Categories', href: '/admin/assessments/categories', icon: '📂' },
      { label: 'Certificates', href: '/admin/assessments/certificates', icon: '🎖️' },
    ],
  },
  {
    title: 'Catalog',
    links: [
      { label: 'Skills', href: '/admin/catalog/skills', icon: '🔧' },
      { label: 'Expertise Areas', href: '/admin/catalog/expertise', icon: '🎯' },
      { label: 'Industries', href: '/admin/catalog/industries', icon: '🏭' },
      { label: 'Countries', href: '/admin/catalog/countries', icon: '🌍' },
      { label: 'Languages', href: '/admin/catalog/languages', icon: '🗣️' },
      { label: 'Currencies', href: '/admin/catalog/currencies', icon: '💱' },
    ],
  },
  {
    title: 'Finance',
    links: [
      { label: 'Transactions', href: '/admin/payments/transactions', icon: '💳' },
      { label: 'Refunds', href: '/admin/payments/refunds', icon: '↩️' },
      { label: 'Payouts', href: '/admin/finance/payouts', icon: '💵' },
      { label: 'Commission', href: '/admin/finance/commission', icon: '⚙️' },
      { label: 'Financial Reports', href: '/admin/finance/reports', icon: '📑' },
    ],
  },
  {
    title: 'System',
    links: [
      { label: 'Settings', href: '/admin/settings', icon: '⚙️' },
      { label: 'Audit Logs', href: '/admin/audit', icon: '📋' },
      { label: 'Security', href: '/admin/security', icon: '🔒' },
      { label: 'Feature Flags', href: '/admin/features', icon: '🚩' },
      { label: 'Maintenance', href: '/admin/maintenance', icon: '🔧' },
      { label: 'System Logs', href: '/admin/logs', icon: '📄' },
    ],
  },
];

function sectionContainsActivePath(section: (typeof sections)[number], pathname: string): boolean {
  return section.links.some((link) =>
    link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href),
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openTitle, setOpenTitle] = useState<string | null>(
    () => sections.find((section) => sectionContainsActivePath(section, pathname))?.title ??
      sections[0]?.title ??
      null,
  );

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const toggleSection = (title: string) => {
    setOpenTitle((prev) => (prev === title ? null : title));
  };

  return (
    <div className={styles.layout}>
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarTitle}>SuperAdmin Panel</div>
        {sections.map((section) => {
          const isOpen = openTitle === section.title;
          return (
            <div key={section.title} className={styles.sidebarSection}>
              <button
                type="button"
                className={styles.sidebarSectionHeader}
                onClick={() => toggleSection(section.title)}
                aria-expanded={isOpen}
              >
                <span>{section.title}</span>
                <span
                  className={styles.sidebarSectionChevron}
                  style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                  aria-hidden="true"
                >
                  ›
                </span>
              </button>
              {isOpen && (
                <div className={styles.sidebarSubLinks}>
                  {section.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`${styles.sidebarSubLink} ${isActive(link.href) ? styles.sidebarSubLinkActive : ''}`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span>{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </aside>

      <main className={styles.main}>
        {children}
      </main>

      <button
        className={styles.toggleBtn}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>
    </div>
  );
}

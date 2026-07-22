import Link from 'next/link';

type ExpertNavKey = 'profile' | 'verification' | 'status';

const ITEMS: { key: ExpertNavKey; label: string; href: string }[] = [
  { key: 'profile', label: '1. Profile', href: '/expert/profile' },
  { key: 'verification', label: '2. Verification', href: '/expert/verification' },
  { key: 'status', label: '3. Status', href: '/expert/application-status' },
];

export function ExpertNav({ active }: { active: ExpertNavKey }) {
  return (
    <nav aria-label="Expert application steps" style={{ marginBottom: '0.5rem' }}>
      <ol
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
      >
        {ITEMS.map((item) => {
          const isActive = item.key === active;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  display: 'inline-block',
                  padding: '0.35rem 0.8rem',
                  borderRadius: '9999px',
                  fontSize: '0.83rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  background: isActive ? '#2563eb' : '#1e293b',
                  color: isActive ? '#fff' : '#cbd5e1',
                  border: `1px solid ${isActive ? '#2563eb' : '#334155'}`,
                }}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

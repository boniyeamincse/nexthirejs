import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-white">
      <nav
        className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3"
        aria-label="Main navigation"
      >
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-zinc-900"
        >
          {siteConfig.name}
        </Link>
        <ul className="flex items-center gap-6">
          {siteConfig.primaryNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600 rounded"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

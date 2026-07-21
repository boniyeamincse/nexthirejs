import { siteConfig } from '@/lib/site-config';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-zinc-50">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="text-sm font-semibold text-zinc-900">
            {siteConfig.name}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Career readiness and hiring platform.
          </p>
        </div>
        <nav aria-label="Footer navigation">
          <ul className="flex gap-4 text-xs text-zinc-500">
            {siteConfig.footerNav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="transition-colors hover:text-zinc-900 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600 rounded"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-xs text-zinc-400">
          &copy; {year} {siteConfig.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

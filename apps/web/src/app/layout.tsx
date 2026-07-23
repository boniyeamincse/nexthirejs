import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { SkipLink } from '@/components/ui/skip-link';
import { SiteHeader } from '@/components/layout/site-header';
import { AuthProvider } from '@/providers/auth-context';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: {
    default: 'NextHire',
    template: '%s | NextHire',
  },
  description: 'Career readiness, learning, interview practice, and hiring platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans">
        <AuthProvider>
          <SkipLink />
          <SiteHeader />
          <main id="main-content" className="flex-1">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}

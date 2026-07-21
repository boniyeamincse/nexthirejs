export type NavItem = {
  label: string;
  href: string;
};

export const siteConfig = {
  name: 'NextHire',
  description: 'Career readiness, learning, interview practice, and hiring platform.',
  primaryNav: [
    { label: 'Home', href: '/' },
    { label: 'Feed', href: '/feed' },
    { label: 'Find Expert', href: '/find-expert' },
  ] satisfies NavItem[],
  footerNav: [
    { label: 'Home', href: '/' },
    { label: 'Status', href: '/status' },
  ] satisfies NavItem[],
} as const;

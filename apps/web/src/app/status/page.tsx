import type { Metadata } from 'next';
import { SUPPORTED_COUNTRIES, COUNTRY_MAP } from '@nexthire/constants/countries';

export const metadata: Metadata = {
  title: 'Status',
};

export default function StatusPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
        Platform Status
      </h1>
      <p className="mt-2 text-zinc-500">Current status of the NextHire platform components.</p>

      <section className="mt-10 space-y-4">
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold text-zinc-900">Web application</h2>
          <p className="mt-1 text-sm text-green-600">running</p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold text-zinc-900">API baseline</h2>
          <p className="mt-1 text-sm text-zinc-500">
            available separately at http://localhost:3001/api/v1
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold text-zinc-900">Database integration</h2>
          <p className="mt-1 text-sm text-amber-600">not connected yet</p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold text-zinc-900">Redis integration</h2>
          <p className="mt-1 text-sm text-amber-600">not connected yet</p>
        </div>
      </section>

      <section className="mt-10 rounded-lg border p-4">
        <h2 className="font-semibold text-zinc-900">Supported Markets</h2>
        <p className="mt-1 text-sm text-zinc-500 mb-4">
          Initial launch markets for the NextHire platform.
        </p>
        <ul className="space-y-2">
          {SUPPORTED_COUNTRIES.map((code) => (
            <li key={code} className="text-sm text-zinc-700">
              <span className="font-medium">{COUNTRY_MAP[code].name}</span> ({code}) -{' '}
              {COUNTRY_MAP[code].callingCode}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 text-sm text-zinc-400">Current phase: Phase 0 — Foundation</p>
    </div>
  );
}

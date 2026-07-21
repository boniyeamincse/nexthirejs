import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
      <section className="text-center sm:text-left">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          {siteConfig.name}
        </h1>
        <p className="mt-4 text-lg text-zinc-600">
          Learn, practise, prove your skills, and get hired.
        </p>
        <p className="mt-2 text-base text-zinc-500">
          {siteConfig.description}
        </p>
      </section>

      <section className="mt-16 rounded-lg border bg-zinc-50 p-6">
        <h2 className="text-lg font-semibold text-zinc-900">
          Platform foundation
        </h2>
        <ul className="mt-4 space-y-2 text-sm text-zinc-600">
          <li>Web application: running</li>
          <li>API baseline: available separately</li>
          <li>Database integration: not connected yet</li>
          <li>Redis integration: not connected yet</li>
        </ul>
        <p className="mt-4">
          <Link
            href="/status"
            className="text-sm font-medium text-blue-600 underline underline-offset-2 hover:text-blue-800 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600 rounded"
          >
            View full status &rarr;
          </Link>
        </p>
      </section>
    </div>
  );
}

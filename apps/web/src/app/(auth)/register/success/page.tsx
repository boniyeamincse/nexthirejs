import Link from 'next/link';

export default function RegisterSuccessPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
      <div className="text-center">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
          aria-hidden="true"
        >
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Account created</h1>

        <p className="mt-4 text-base text-zinc-600">
          Your candidate account has been created. Email verification is required before you can
          sign in.
        </p>

        <p className="mt-8 text-sm text-zinc-500">
          <Link
            href="/"
            className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-800 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600 rounded"
          >
            Return to home
          </Link>
        </p>
      </div>
    </div>
  );
}

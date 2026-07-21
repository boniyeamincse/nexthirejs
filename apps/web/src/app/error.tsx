'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('Application error:', error);

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-32 text-center">
      <h1 className="text-3xl font-bold text-zinc-900">Something went wrong</h1>
      <p className="mt-4 text-base text-zinc-600">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={() => reset()}
        className="mt-8 inline-flex items-center rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
      >
        Try again
      </button>
    </div>
  );
}

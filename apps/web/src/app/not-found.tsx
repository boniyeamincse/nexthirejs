import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-32 text-center">
      <h1 className="text-5xl font-bold text-zinc-900">404</h1>
      <p className="mt-4 text-lg text-zinc-600">Page not found.</p>
      <p className="mt-2 text-sm text-zinc-500">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
      >
        Go home
      </Link>
    </div>
  );
}

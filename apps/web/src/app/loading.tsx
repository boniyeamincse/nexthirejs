export default function Loading() {
  return (
    <div
      className="mx-auto flex max-w-3xl items-center justify-center px-4 py-32"
      aria-live="polite"
      aria-busy="true"
    >
      <p className="text-sm text-zinc-400">Loading...</p>
    </div>
  );
}

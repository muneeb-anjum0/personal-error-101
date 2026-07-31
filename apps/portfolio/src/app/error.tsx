"use client";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="max-w-lg">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-red-300">
          MUNEEB.SYSTEMS
        </p>
        <h1 className="mt-5 text-3xl font-semibold text-white">Something needs attention.</h1>
        <p className="mt-4 text-sm leading-6 text-zinc-300">{error.message}</p>
        <button
          className="mt-8 border border-white/20 px-4 py-2 text-sm font-medium text-white"
          type="button"
          onClick={() => reset()}
        >
          Try again
        </button>
      </section>
    </main>
  );
}

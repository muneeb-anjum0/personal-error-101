"use client";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="missing-screen">
      <p className="technical-label">CONTENT FAILURE</p>
      <h1>Something needs attention.</h1>
      <p>{error.message}</p>
      <button
        className="button button-secondary button-medium"
        type="button"
        onClick={() => reset()}
      >
        <span>Retry</span>
      </button>
    </main>
  );
}

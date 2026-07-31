import { validatePortfolioContent } from "@/lib/content";

export default async function HomePage() {
  await validatePortfolioContent();

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="w-full max-w-xl">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">
          MUNEEB.SYSTEMS
        </p>
        <h1 className="mt-5 text-3xl font-semibold text-white">Foundation initialized.</h1>
        <dl className="mt-8 grid gap-3 text-sm text-zinc-200">
          <div className="flex items-center justify-between border-b border-white/10 py-3">
            <dt>Portfolio</dt>
            <dd className="font-medium text-emerald-300">Ready</dd>
          </div>
          <div className="flex items-center justify-between border-b border-white/10 py-3">
            <dt>Generator API</dt>
            <dd className="font-medium text-amber-300">Pending connection</dd>
          </div>
          <div className="flex items-center justify-between border-b border-white/10 py-3">
            <dt>Static content</dt>
            <dd className="font-medium text-emerald-300">Valid</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}

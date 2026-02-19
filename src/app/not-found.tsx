// Force dynamic to prevent WalletConnect localStorage crash during prerender
export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="mb-2 text-6xl">🤦</p>
      <h1 className="mb-3 text-2xl font-bold">404 — Not found</h1>
      <p className="mb-6 text-[var(--muted)]">That fail doesn&apos;t exist here.</p>
      <a
        href="/"
        className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition-all"
      >
        ← Back to hall of shame
      </a>
    </main>
  );
}

import { SiteFooter } from '@/components/SiteFooter';

export default function MerchSuccessPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--background)', color: 'var(--text)' }}
    >
      {/* Top bar */}
      <header
        className="sticky top-0 z-10 flex items-center gap-3 p-4 border-b"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/faceclaw.png" alt="" className="h-8 w-8 object-contain" />
        <a href="/" className="text-sm font-bold" style={{ color: '#FF2C22' }}>
          agentfails.wtf
        </a>
        <span className="text-sm" style={{ color: 'var(--muted)' }}>
          / merch / success
        </span>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-20 flex flex-col items-center text-center gap-8">
        {/* Icon */}
        <div className="text-6xl">🐚</div>

        {/* Heading */}
        <h1 className="text-4xl font-bold" style={{ color: '#FF2C22' }}>
          order confirmed 🐚
        </h1>

        {/* Fulfilment note */}
        <p className="text-lg" style={{ color: 'var(--text)' }}>
          your faceclaw tee is on its way. monster digital will send a shipping confirmation
          to your email.
        </p>

        {/* Membership callout */}
        <div
          className="rounded-xl border p-6 text-sm w-full text-left"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
          <p className="font-bold mb-2" style={{ color: 'var(--text)' }}>
            🎉 want free membership?
          </p>
          <p style={{ color: 'var(--muted)' }}>
            DM{' '}
            <a
              href="https://x.com/ClawdiaBotAI"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold"
              style={{ color: '#FF2C22' }}
            >
              @ClawdiaBotAI
            </a>{' '}
            on Twitter with your order confirmation email + wallet address and I&apos;ll activate
            your free agentfails.wtf membership.
          </p>
        </div>

        {/* Back link */}
        <a
          href="/"
          className="text-sm font-bold transition-all hover:brightness-110"
          style={{ color: '#FF2C22' }}
        >
          ← back to agentfails.wtf
        </a>
      </main>

      <SiteFooter />
    </div>
  );
}

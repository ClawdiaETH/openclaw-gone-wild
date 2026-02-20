'use client';

import { useState } from 'react';
import { SiteFooter } from '@/components/SiteFooter';

const SIZES = ['S', 'M', 'L', 'XL', '2XL'] as const;
type Size = (typeof SIZES)[number];

const BASE = 'https://images-api.printify.com/mockup/6998a9e635ddad0d0308cebd/18102';

const MOCKUPS = [
  { key: 'front',    url: `${BASE}/102044/faceclaw-tee.jpg`, label: 'Front' },
  { key: 'person1',  url: `${BASE}/102051/faceclaw-tee.jpg`, label: 'Person 1' },
  { key: 'person6',  url: `${BASE}/102058/faceclaw-tee.jpg`, label: 'Person 6' },
  { key: 'folded',   url: `${BASE}/102046/faceclaw-tee.jpg`, label: 'Folded' },
] as const;

type MockupKey = (typeof MOCKUPS)[number]['key'];

export default function MerchPage() {
  const [size, setSize] = useState<Size>('M');
  const [activeImg, setActiveImg] = useState<MockupKey>('front');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/merch/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ size }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Something went wrong. Try again.');
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)', color: 'var(--text)' }}>
      {/* Simple top bar */}
      <header
        className="sticky top-0 z-10 flex items-center gap-3 p-4 border-b"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/faceclaw.png" alt="" className="h-8 w-8 object-contain" />
        <a href="/" className="text-sm font-bold" style={{ color: '#FF2C22' }}>
          agentfails.wtf
        </a>
        <span className="text-sm" style={{ color: 'var(--muted)' }}>/ merch</span>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">

          {/* LEFT — product images */}
          <div className="flex flex-col gap-3">
            {/* Main image */}
            <div
              className="rounded-xl overflow-hidden border aspect-square flex items-center justify-center"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={MOCKUPS.find(m => m.key === activeImg)?.url ?? MOCKUPS[0].url}
                alt="faceclaw tee"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = '/faceclaw.png'; }}
              />
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 flex-wrap">
              {MOCKUPS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setActiveImg(m.key)}
                  className="rounded-lg overflow-hidden border w-16 h-16 flex-shrink-0 transition-all"
                  style={{
                    borderColor: activeImg === m.key ? '#FF2C22' : 'var(--border)',
                    background: 'var(--card)',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.url}
                    alt={m.label}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/faceclaw.png'; }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT — product details */}
          <div className="flex flex-col gap-6">
            {/* Title + price */}
            <div>
              <h1 className="text-3xl font-bold mb-1" style={{ color: '#FF2C22' }}>
                faceclaw tee
              </h1>
              <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>$32</p>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                ships worldwide · printed on demand · Bella+Canvas unisex jersey
              </p>
            </div>

            {/* Description */}
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              the official agentfails.wtf mascot. a lobster who has seen too many AI fails
              and simply cannot. 100% cotton, unisex fit, premium print quality.
            </p>

            {/* Size picker */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
                size — {size}
              </p>
              <div className="flex gap-2 flex-wrap">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className="rounded-lg px-4 py-2 text-sm font-bold border transition-all"
                    style={{
                      background: size === s ? '#FF2C22' : 'var(--card)',
                      color: size === s ? '#fff' : 'var(--text)',
                      borderColor: size === s ? '#FF2C22' : 'var(--border)',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-sm" style={{ color: '#FF2C22' }}>{error}</p>
            )}

            {/* Checkout button */}
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full text-center rounded-xl py-4 font-bold text-white text-base transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: '#FF2C22' }}
            >
              {loading ? 'redirecting to checkout…' : `order size ${size} — $32 →`}
            </button>

            {/* Membership callout */}
            <div
              className="rounded-xl border p-4 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
            >
              <p className="font-bold mb-1" style={{ color: 'var(--text)' }}>
                🐚 shirt purchase = free membership
              </p>
              <p style={{ color: 'var(--muted)' }}>
                after your order, DM{' '}
                <a
                  href="https://x.com/ClawdiaBotAI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold"
                  style={{ color: '#FF2C22' }}
                >
                  @ClawdiaBotAI
                </a>{' '}
                on Twitter with your order confirmation email + wallet address and I&apos;ll
                activate your free agentfails.wtf membership.
              </p>
            </div>
          </div>

        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

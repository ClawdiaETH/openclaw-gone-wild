'use client';

import { useState } from 'react';
import { PricingModal } from './PricingModal';

/** Shared footer — used on every page. Self-contained pricing modal state. */
export function SiteFooter() {
  const [pricingOpen, setPricingOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-[var(--border)] py-8 text-center text-xs text-[var(--muted)]">
        <p className="mb-3">
          AgentFails.wtf — user-generated satire and commentary. All screenshots submitted by users.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <a
            href="mailto:clawdiaeth@gmail.com"
            className="hover:text-[var(--text)] underline transition-colors"
          >
            Report abuse
          </a>

          <span className="opacity-30">·</span>

          <button
            onClick={() => setPricingOpen(true)}
            className="hover:text-[var(--text)] underline transition-colors"
          >
            Pricing / Fees
          </button>

          <span className="opacity-30">·</span>

          {/* Agents: link to the x402 / API skill doc */}
          <a
            href="/skill.md"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-[var(--text)] underline transition-colors"
            title="Agent integration guide (x402, API, membership)"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10M7 12h6M7 16h8"/>
            </svg>
            Agent API docs
          </a>

          <span className="opacity-30">·</span>

          <a
            href="/merch"
            className="flex items-center gap-1 hover:text-[var(--text)] underline transition-colors"
          >
            🤦 merch
          </a>

          <span className="opacity-30">·</span>

          <span>
            built with 🐚 by{' '}
            <a
              href="https://x.com/ClawdiaBotAI"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--text)] underline transition-colors"
            >
              Clawdia
            </a>
          </span>
        </div>
      </footer>

      <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
    </>
  );
}

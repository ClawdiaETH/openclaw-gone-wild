'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Header({ onOpenSubmit }: { onOpenSubmit: () => void }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-card border-b border-border bg-opacity-90 backdrop-blur-md p-4 md:h-14">
      <a href="/" className="flex items-center gap-2 font-bold text-lg sm:text-xl shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/faceclaw.png" alt="" className="h-7 w-7 sm:h-8 sm:w-8 object-contain" />
        <span style={{ color: '#FF2C22' }}>agentfails.wtf</span>
      </a>
      <div className="flex items-center gap-2">
        {/* Merch link — icon only on mobile, icon + label on sm+ */}
        <a
          href="/merch"
          title="Merch"
          className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2 sm:px-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/faceclaw.png" alt="merch" className="h-5 w-5 object-contain" />
          <span className="hidden sm:inline">merch</span>
        </a>

        {/* Primary action — filled accent button */}
        <button
          className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 sm:px-4 py-2 text-sm font-bold text-white hover:brightness-110 transition-all"
          onClick={onOpenSubmit}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span>Submit</span>
        </button>

        {/* Ghost wallet button — icon+address on connected, icon-only on mobile when not connected */}
        <ConnectButton.Custom>
          {({ account, chain, openConnectModal, openAccountModal, mounted }) => {
            const ready = mounted;
            const connected = ready && account && chain;
            return (
              <button
                onClick={connected ? openAccountModal : openConnectModal}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2 sm:px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
              >
                {connected ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-[oklch(0.75_0.18_142)]" />
                    <span className="hidden sm:inline">{account.displayName}</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="oklch(0.68 0.18 260)" strokeWidth="1.5">
                      <rect x="2" y="7" width="20" height="15" rx="2"/>
                      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                      <circle cx="17" cy="14" r="1" fill="oklch(0.68 0.18 260)" stroke="none"/>
                    </svg>
                    <span className="hidden sm:inline">Connect wallet</span>
                  </>
                )}
              </button>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  );
}

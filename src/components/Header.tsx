'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState } from 'react';

export function Header({ onOpenSubmit }: { onOpenSubmit: () => void }) {
  const { isConnected, address } = useAccount();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-card border-b border-border bg-opacity-90 backdrop-blur-md p-4 md:h-14">
      <a href="#" className="flex items-center gap-2 font-bold text-xl">
        <span className="text-2xl">🐚</span>
        <span className="text-accent">OpenClaw</span> Gone Wild
      </a>
      <div className="flex items-center gap-3">
        <button
          className="rounded-full bg-accent text-white px-3 py-1 text-sm font-medium hover:brightness-110"
          onClick={onOpenSubmit}
        >
          + Submit
        </button>
        <ConnectButton />
      </div>
    </header>
  );
}

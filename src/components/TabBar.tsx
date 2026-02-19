'use client';

import React from 'react';
import { Tab } from '@/hooks/usePosts';

interface TabBarProps {
  /** Feed mode: active tab + onClick handler */
  activeTab?: Tab;
  onChange?: (tab: Tab) => void;
  /** Link mode: tabs are anchor links back to /?tab=x (for permalink pages) */
  linkMode?: boolean;
}

// ── Colored SVG icons (no emoji) ──────────────────────────────────────────────

const FlameIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C9 7 7 10.5 7 14a5 5 0 0 0 10 0c0-2-1-4-2-5.5-1 2-2.5 3-3.5 3-1.1 0-2-.9-2-2 0-2 2.5-5.5 2.5-7.5Z"
      fill="oklch(0.75 0.22 35 / 0.25)" stroke="oklch(0.75 0.22 35)" />
  </svg>
);

const BoltIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"
      fill="oklch(0.72 0.2 240 / 0.25)" stroke="oklch(0.72 0.2 240)" />
  </svg>
);

const TrophyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H3V4h3M18 9h3V4h-3M6 4h12v7a6 6 0 0 1-12 0V4Z"
      fill="oklch(0.82 0.18 85 / 0.2)" stroke="oklch(0.82 0.18 85)" />
    <path d="M12 17v4M8 21h8" stroke="oklch(0.82 0.18 85)" />
  </svg>
);

const ClawIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3c0 0-4 3-4 8s4 6 4 6" stroke="oklch(0.75 0.22 25)" />
    <path d="M12 3c0 0 4 3 4 8s-4 6-4 6" stroke="oklch(0.75 0.22 25)" />
    <path d="M8 17c0 2 1.5 4 4 4s4-2 4-4"
      fill="oklch(0.75 0.22 25 / 0.2)" stroke="oklch(0.75 0.22 25)" />
    <circle cx="12" cy="10" r="2" fill="oklch(0.75 0.22 25 / 0.4)" stroke="oklch(0.75 0.22 25)" />
  </svg>
);

const BotIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="8" width="18" height="13" rx="2"
      fill="oklch(0.68 0.18 295 / 0.2)" stroke="oklch(0.68 0.18 295)" />
    <path d="M9 12h.01M15 12h.01M9 16h6" stroke="oklch(0.68 0.18 295)" />
    <path d="M12 8V5M9 5h6" stroke="oklch(0.68 0.18 295)" />
  </svg>
);

const TABS: { id: Tab; label: string; Icon: () => React.ReactElement }[] = [
  { id: 'hot',      label: 'Hot',          Icon: FlameIcon  },
  { id: 'new',      label: 'New',          Icon: BoltIcon   },
  { id: 'hof',      label: 'Hall of Fame', Icon: TrophyIcon },
  { id: 'openclaw', label: 'OpenClaw',     Icon: ClawIcon   },
  { id: 'other',    label: 'Other AIs',    Icon: BotIcon    },
];

export function TabBar({ activeTab, onChange, linkMode = false }: TabBarProps) {
  return (
    <div className="flex gap-0.5 overflow-x-auto border-b border-[var(--border)] bg-[var(--bg)] px-4 scrollbar-none">
      {TABS.map(({ id, label, Icon }) => {
        const isActive = activeTab === id;
        const baseClass = 'flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors';
        const activeClass = 'border-[var(--accent)] text-[var(--text)]';
        const inactiveClass = 'border-transparent text-[var(--muted)] hover:text-[var(--text)]';

        if (linkMode) {
          return (
            <a
              key={id}
              href={`/?tab=${id}`}
              className={`${baseClass} ${inactiveClass}`}
            >
              <Icon />
              {label}
            </a>
          );
        }

        return (
          <button
            key={id}
            onClick={() => onChange?.(id)}
            className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
          >
            <Icon />
            {label}
          </button>
        );
      })}
    </div>
  );
}

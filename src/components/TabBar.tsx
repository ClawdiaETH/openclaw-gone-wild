'use client';

import { Tab } from '@/hooks/usePosts';

interface TabBarProps {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'hot',      label: '🔥 Hot' },
  { id: 'new',      label: '🆕 New' },
  { id: 'hof',      label: '🏆 Hall of Fame' },
  { id: 'openclaw', label: '🐚 OpenClaw' },
  { id: 'other',    label: '🤖 Other AIs' },
];

export function TabBar({ activeTab, onChange }: TabBarProps) {
  return (
    <div className="flex gap-0.5 overflow-x-auto border-b border-[var(--border)] bg-[var(--bg)] px-4 scrollbar-none">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === tab.id
              ? 'border-[var(--accent)] text-[var(--text)]'
              : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

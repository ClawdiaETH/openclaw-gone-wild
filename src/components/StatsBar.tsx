'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Stats {
  posts: number;
  upvotes: number;
  members: number;
}

function formatNum(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

export function StatsBar() {
  const [stats, setStats] = useState<Stats>({ posts: 0, upvotes: 0, members: 0 });

  useEffect(() => {
    async function fetchStats() {
      const [postsRes, membersRes, upvotesRes] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('members').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('upvote_count'),
      ]);
      const totalUpvotes = (upvotesRes.data ?? []).reduce(
        (sum, p) => sum + (p.upvote_count ?? 0),
        0,
      );
      setStats({
        posts: postsRes.count ?? 0,
        members: membersRes.count ?? 0,
        upvotes: totalUpvotes,
      });
    }
    fetchStats();
  }, []);

  return (
    <div className="flex items-center justify-around rounded-[12px] border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3">
      <StatItem value={formatNum(stats.posts)} label="Fails Submitted" color="var(--accent)" />
      <div className="h-8 w-px bg-[var(--border)]" />
      <StatItem value={formatNum(stats.upvotes)} label="Upvotes" color="var(--accent2)" />
      <div className="h-8 w-px bg-[var(--border)]" />
      <StatItem value={formatNum(stats.members)} label="Members" color="var(--accent3)" />
    </div>
  );
}

function StatItem({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className="font-mono text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="mt-0.5 text-xs uppercase tracking-wider text-[var(--muted)]">{label}</div>
    </div>
  );
}

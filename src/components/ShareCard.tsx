'use client';

/**
 * ShareCard — the share-optimized version of a PostCard.
 *
 * Rendered off-screen inside ShareModal so html-to-image can capture it.
 * Key differences from PostCard:
 *  - No interactive elements (buttons, links)
 *  - Bottom-right shows "🧑 agentfails.wtf" branding instead of metadata
 *  - Fixed 680px wide for consistent export dimensions
 *  - Uses crossOrigin="anonymous" on the screenshot image for canvas capture
 */

import { forwardRef } from 'react';
import { Post } from '@/types';
import { formatUpvotes } from '@/lib/utils';

const AGENT_LABELS: Record<string, string> = {
  openclaw: '🦞 OpenClaw',
  claude:   '🤖 Claude',
  chatgpt:  '💚 ChatGPT',
  gemini:   '💙 Gemini',
  grok:     '🦅 Grok',
  other:    '🤖 Other AI',
};

const FAIL_LABELS: Record<string, string> = {
  hallucination: '🏜️ Hallucination',
  confident:     '🫡 Confidently Wrong',
  loop:          '♾️ Infinite Loop',
  apology:       '🙏 Apology Loop',
  uno_reverse:   '🔄 Uno Reverse',
  unhinged:      '🤪 Just Unhinged',
};

const FAIL_COLORS: Record<string, string> = {
  hallucination: 'bg-[oklch(0.72_0.2_25/0.12)] text-[oklch(0.78_0.18_25)] border-[oklch(0.72_0.2_25/0.3)]',
  confident:     'bg-[oklch(0.82_0.18_85/0.12)] text-[oklch(0.82_0.18_85)] border-[oklch(0.82_0.18_85/0.3)]',
  loop:          'bg-[oklch(0.75_0.16_140/0.12)] text-[oklch(0.75_0.16_140)] border-[oklch(0.75_0.16_140/0.3)]',
  apology:       'bg-[oklch(0.68_0.18_295/0.12)] text-[oklch(0.68_0.18_295)] border-[oklch(0.68_0.18_295/0.3)]',
  uno_reverse:   'bg-[oklch(0.72_0.18_320/0.12)] text-[oklch(0.78_0.18_320)] border-[oklch(0.72_0.18_320/0.3)]',
  unhinged:      'bg-[oklch(0.72_0.2_25/0.12)] text-[oklch(0.78_0.18_25)] border-[oklch(0.72_0.2_25/0.3)]',
};

interface ShareCardProps {
  post: Post;
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  function ShareCard({ post }, ref) {
    const failColor = FAIL_COLORS[post.fail_type] ?? FAIL_COLORS.hallucination;

    return (
      <div
        ref={ref}
        style={{ width: 680, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
        className="overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--bg-card)]"
      >
        {/* ── Faux-macOS title bar ── */}
        <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[oklch(0.08_0.01_260)] px-3 py-2">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <span className="ml-2 font-mono text-sm text-[var(--muted)]">
            {AGENT_LABELS[post.agent] ?? post.agent} — session
          </span>
        </div>

        {/* ── Screenshot ── */}
        <div className="bg-[oklch(0.09_0.01_260)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image_url}
            alt={post.title ?? 'AI fail screenshot'}
            crossOrigin="anonymous"
            className="block max-h-[520px] w-full object-contain"
          />
        </div>

        {/* ── Card body ── */}
        <div className="px-4 py-3">
          {post.title && (
            <h2 className="mb-2 text-base font-semibold leading-snug">{post.title}</h2>
          )}

          {/* Footer row */}
          <div className="flex items-center justify-between gap-2">
            {/* Left: vote count + tags */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Vote count */}
              <span className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[oklch(0.2_0.015_260)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                <span className="text-sm">🔥</span>
                {formatUpvotes(post.upvote_count)}
              </span>

              {/* Fail type */}
              <span className={`rounded-full border px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${failColor}`}>
                {FAIL_LABELS[post.fail_type] ?? post.fail_type}
              </span>

              {/* Agent */}
              <span className="rounded-full border border-[var(--border)] bg-[oklch(0.2_0.01_260)] px-2 py-0.5 text-xs text-[var(--muted)]">
                {AGENT_LABELS[post.agent] ?? post.agent}
              </span>
            </div>

            {/* Right: branding */}
            <div className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-[var(--accent)]">
              <span>🧑‍💻</span>
              <span>agentfails.wtf</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

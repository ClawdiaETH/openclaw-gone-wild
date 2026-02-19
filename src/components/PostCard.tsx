'use client';

import { useRef, useState } from 'react';
import { Post } from '@/types';
import { truncateAddress, timeAgo, formatUpvotes } from '@/lib/utils';
import { ReportButton } from './ReportButton';
import { showToast } from './Toast';

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

interface PostCardProps {
  post: Post;
  voted: boolean;
  onVote: (postId: string) => void;
  walletAddress: string | undefined;
  rank?: number;
}

export function PostCard({ post, voted, onVote, walletAddress, rank }: PostCardProps) {
  const [localVoted, setLocalVoted] = useState(voted);
  const [localCount, setLocalCount] = useState(post.upvote_count);
  const [heartVisible, setHeartVisible] = useState(false);
  const lastTapRef = useRef<number>(0);

  function handleVote() {
    if (!walletAddress) { showToast('🔗 Connect wallet to vote'); return; }
    if (localVoted) { showToast('Already voted 😅'); return; }
    setLocalVoted(true);
    setLocalCount(c => c + 1);
    onVote(post.id);
    showToast('🔥 Vote counted!');
  }

  function handleImageTap() {
    const now = Date.now();
    if (now - lastTapRef.current < 350) {
      // double-tap
      handleVote();
      if (!localVoted) {
        setHeartVisible(true);
        setTimeout(() => setHeartVisible(false), 700);
      }
    }
    lastTapRef.current = now;
  }

  const failColor = FAIL_COLORS[post.fail_type] ?? FAIL_COLORS.hallucination;

  return (
    <article className="relative overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--bg-card)] transition-all duration-200 hover:border-[oklch(0.3_0.02_260)] hover:shadow-lg">

      {/* ── Faux-macOS chrome ── */}
      <div
        className="relative cursor-pointer select-none"
        onClick={handleImageTap}
      >
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[oklch(0.08_0.01_260)] px-3 py-2">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <span className="ml-2 font-mono text-sm text-[var(--muted)]">
            {AGENT_LABELS[post.agent] ?? post.agent} — session
          </span>
          {/* Hall-of-fame rank badge — right-aligned in title bar */}
          {rank && rank <= 3 && (
            <div className="ml-auto rounded px-1.5 py-0.5 font-mono text-xs font-bold" style={{ background: 'var(--gold)', color: 'oklch(0.2 0.05 85)' }}>
              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'} #{rank}
            </div>
          )}
        </div>

        {/* Screenshot */}
        <div className="relative bg-[oklch(0.09_0.01_260)]">
          <img
            src={post.image_url}
            alt={post.title}
            className="block max-h-[520px] w-full object-contain"
            loading="lazy"
          />
          {/* Heart burst on double-tap */}
          {heartVisible && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="animate-ping text-6xl">❤️</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="px-4 py-3">
        <h2 className="mb-1 text-base font-semibold leading-snug">{post.title}</h2>
        {post.caption && (
          <p className="mb-2.5 text-sm leading-relaxed text-[var(--muted)]">{post.caption}</p>
        )}

        {/* Footer row */}
        <div className="flex flex-wrap items-center gap-2">

          {/* Upvote button */}
          <button
            onClick={handleVote}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
              localVoted
                ? 'border-[var(--accent)] bg-[oklch(0.72_0.2_25/0.15)] text-[var(--accent)]'
                : 'border-[var(--border)] bg-[oklch(0.2_0.015_260)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
            }`}
          >
            <span className={`text-sm transition-transform ${localVoted ? 'scale-125' : ''}`}>🔥</span>
            {formatUpvotes(localCount)}
          </button>

          {/* Fail type tag */}
          <span className={`rounded-full border px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${failColor}`}>
            {FAIL_LABELS[post.fail_type] ?? post.fail_type}
          </span>

          {/* Agent tag */}
          <span className="rounded-full border border-[var(--border)] bg-[oklch(0.2_0.01_260)] px-2 py-0.5 text-xs text-[var(--muted)]">
            {AGENT_LABELS[post.agent] ?? post.agent}
          </span>

          {/* Meta: submitter + time */}
          <div className="ml-auto flex items-center gap-1.5 text-xs text-[var(--muted)]">
            {post.submitter_wallet ? (
              <>
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white">
                  {post.submitter_wallet[2]?.toUpperCase()}
                </span>
                <span>{truncateAddress(post.submitter_wallet)}</span>
              </>
            ) : (
              <span className="font-mono opacity-60">🤖 agent</span>
            )}
            <span>·</span>
            <span>{timeAgo(post.created_at)}</span>
          </div>

          {/* Source link */}
          {post.source_link && (
            <a
              href={post.source_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--muted)] underline hover:text-[var(--text)] transition-colors"
              onClick={e => e.stopPropagation()}
            >
              source ↗
            </a>
          )}

          {/* Report */}
          <ReportButton postId={post.id} reporterWallet={walletAddress} />

          {/* Permalink / comments */}
          <a
            href={`/posts/${post.id}#comments`}
            className="flex items-center gap-1 text-xs text-[var(--muted)] transition-colors hover:text-[var(--text)]"
            onClick={e => e.stopPropagation()}
            title="View comments · $0.10 USDC per comment"
          >
            💬 discuss
          </a>
        </div>
      </div>
    </article>
  );
}

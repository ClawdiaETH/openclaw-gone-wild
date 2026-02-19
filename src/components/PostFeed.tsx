'use client';

import { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { usePosts, Tab } from '@/hooks/usePosts';
import { useVote } from '@/hooks/useVote';
import { useMember } from '@/hooks/useMember';
import { PostCard } from './PostCard';

interface PostFeedProps {
  activeTab: Tab;
  onNeedSignup?: () => void;
}

export function PostFeed({ activeTab, onNeedSignup }: PostFeedProps) {
  const { address } = useAccount();
  const { member } = useMember(address);
  const { posts, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = usePosts(activeTab);
  const voteMutation = useVote();

  // ── Voted post IDs — persisted to localStorage per wallet ──────────────────
  // Key is wallet-scoped so switching wallets doesn't bleed state
  const storageKey = address ? `agentfails:voted:${address.toLowerCase()}` : null;

  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

  // Load from localStorage when wallet connects / changes
  useEffect(() => {
    if (!storageKey) { setVotedIds(new Set()); return; }
    try {
      const raw = localStorage.getItem(storageKey);
      setVotedIds(raw ? new Set(JSON.parse(raw) as string[]) : new Set());
    } catch {
      setVotedIds(new Set());
    }
  }, [storageKey]);

  // Persist whenever votedIds changes (skip if no wallet)
  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify([...votedIds]));
    } catch { /* storage quota exceeded — silently ignore */ }
  }, [votedIds, storageKey]);

  // Intersection observer for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  function handleVote(postId: string) {
    if (!address || !member) {
      onNeedSignup?.();
      return;
    }
    const removing = votedIds.has(postId);
    setVotedIds(prev => {
      const next = new Set(prev);
      removing ? next.delete(postId) : next.add(postId);
      return next;
    });
    voteMutation.mutate({ postId, voterWallet: address, removing });
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-64 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--bg-card)]" />
        ))}
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="py-16 text-center text-[var(--muted)]">
        <div className="mb-3 text-5xl">🦗</div>
        <p className="text-sm">nothing here yet — be the first to submit a fail 🐚</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {posts.map((post, i) => (
          <PostCard
            key={post.id}
            post={post}
            voted={votedIds.has(post.id)}
            onVote={handleVote}
            walletAddress={address}
            rank={activeTab === 'hof' ? i + 1 : undefined}
            onNeedSignup={onNeedSignup}
          />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="py-6 text-center text-xs text-[var(--muted)]">
        {isFetchingNextPage
          ? 'loading more fails...'
          : hasNextPage
          ? ''
          : posts.length > 0
          ? '— you\'ve seen the best of today —'
          : ''}
      </div>
    </>
  );
}

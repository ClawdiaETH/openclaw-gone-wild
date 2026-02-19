'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Post, Comment } from '@/types';
import { PostCard } from '@/components/PostCard';
import { CommentSection } from '@/components/CommentSection';
import { showToast } from '@/components/Toast';

interface Props {
  post: Post;
  initialComments: Comment[];
}

export function PostPermalinkView({ post, initialComments }: Props) {
  const { address } = useAccount();
  const [voted, setVoted] = useState(false);

  async function handleVote(postId: string) {
    try {
      await fetch(`/api/posts/${postId}/upvote`, { method: 'POST' });
    } catch {
      showToast('❌ Vote failed');
    }
  }

  return (
    <div>
      {/* Back link */}
      <a
        href="/"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-[var(--muted)] transition-colors hover:text-[var(--text)]"
      >
        ← back to hall of shame
      </a>

      {/* Post card */}
      <PostCard
        post={post}
        voted={voted}
        onVote={(id) => { setVoted(true); void handleVote(id); }}
        walletAddress={address}
        rank={undefined}
      />

      {/* Comments */}
      <CommentSection postId={post.id} initialComments={initialComments} />
    </div>
  );
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryClient as sharedQueryClient } from '@/lib/queryClient';

interface VoteArgs {
  postId: string;
  voterWallet: string;
  removing: boolean; // true = un-vote, false = vote
}

export function useVote() {
  const queryClient = useQueryClient() ?? sharedQueryClient;

  return useMutation({
    mutationFn: async ({ postId, voterWallet }: VoteArgs) => {
      const res = await fetch(`/api/posts/${postId}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: voterWallet }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      return res.json() as Promise<{ ok: boolean; action: 'added' | 'removed'; count: number }>;
    },

    onMutate: async ({ postId, removing }) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const previous = queryClient.getQueryData(['posts']);
      // Optimistic update
      queryClient.setQueriesData({ queryKey: ['posts'] }, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((pg: any) => ({
            ...pg,
            posts: pg.posts.map((p: any) =>
              p.id === postId
                ? { ...p, upvote_count: Math.max(0, (p.upvote_count ?? 0) + (removing ? -1 : 1)) }
                : p
            ),
          })),
        };
      });
      return { previous };
    },

    onError: (_err, _vars, context: any) => {
      if (context?.previous) queryClient.setQueryData(['posts'], context.previous);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

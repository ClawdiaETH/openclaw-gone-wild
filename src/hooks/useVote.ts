import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Vote } from '@/types';

export function useVote() {
  const queryClient = useQueryClient();
  const mutation = useMutation(
    async ({ postId, voterWallet }: { postId: string; voterWallet: string }) => {
      // Insert vote record
      const { data: vote, error: voteErr } = await supabase.from<Vote>('votes').insert({
        post_id: postId,
        voter_wallet: voterWallet,
      }).single();
      if (voteErr) throw voteErr;
      // Increment upvote count on post
      const { error: updErr } = await supabase
        .from('posts')
        .update({ upvote_count: supabase.rpc('increment_upvotes', { post_id: postId }) })
        .eq('id', postId);
      // Note: using RPC placeholder; fallback to increment manually below if needed
      if (updErr) {
        // fallback: fetch current count then increment
        const { data: post, error: postErr } = await supabase
          .from('posts')
          .select('upvote_count')
          .eq('id', postId)
          .single();
        if (postErr) throw postErr;
        await supabase.from('posts').update({ upvote_count: (post?.upvote_count ?? 0) + 1 }).eq('id', postId);
      }
      return vote;
    },
    {
      // optimistic update
      onMutate: async ({ postId }) => {
        await queryClient.cancelQueries(['posts']);
        const previous = queryClient.getQueryData(['posts']);
        queryClient.setQueryData(['posts'], (old: any) => {
          if (!old) return old;
          const pages = old.pages.map((pg: any) => {
            const posts = pg.posts.map((p: any) =>
              p.id === postId ? { ...p, upvote_count: (p.upvote_count ?? 0) + 1 } : p,
            );
            return { ...pg, posts };
          });
          return { ...old, pages };
        });
        return { previous };
      },
      onError: (err, variables, context: any) => {
        if (context?.previous) queryClient.setQueryData(['posts'], context.previous);
      },
      onSettled: () => {
        queryClient.invalidateQueries(['posts']);
      },
    },
  );
  return mutation;
}

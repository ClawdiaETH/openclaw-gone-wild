import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Post } from '@/types';

export type Tab = 'hot' | 'new' | 'hof' | 'openclaw' | 'other';

export function usePosts(activeTab: Tab) {
  const PAGE_SIZE = 10;

  const fetchPosts = async ({ pageParam = 0 }: { pageParam?: number }) => {
    let query = supabase
      .from<Post>('posts')
      .select('*', { count: 'exact' })
      .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);
    // apply sorting/filter per tab
    switch (activeTab) {
      case 'hot':
        query = query.order('upvote_count', { ascending: false });
        break;
      case 'new':
        query = query.order('created_at', { ascending: false });
        break;
      case 'hof':
        query = query.order('upvote_count', { ascending: false });
        break;
      case 'openclaw':
        query = query.eq('agent', 'openclaw');
        break;
      case 'other':
        query = query.not('agent', 'eq', 'openclaw');
        break;
    }
    const { data, error, count } = await query;
    if (error) throw error;
    return { posts: data ?? [], nextPage: pageParam + 1, total: count ?? 0 };
  };

  const result = useInfiniteQuery(['posts', activeTab], fetchPosts, {
    getNextPageParam: (last) => (last.posts.length === PAGE_SIZE ? last.nextPage : undefined),
    staleTime: 1000 * 30,
  });

  const posts = result.data?.pages.flatMap(p => p.posts) ?? [];
  const total = result.data?.pages[0]?.total ?? 0;

  return { ...result, posts, total };
}

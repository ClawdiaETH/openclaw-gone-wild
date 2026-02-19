// Opt out of static pre-render (data is dynamic, WalletConnect SSR quirks)
export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PermalinkHeader } from './PermalinkHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { TabBar } from '@/components/TabBar';
import { Toast } from '@/components/Toast';
import { PostPermalinkView } from './PostPermalinkView';
import type { Post, Comment } from '@/types';

// ── Data fetching ─────────────────────────────────────────────────────────────

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  );
}

async function getPost(id: string): Promise<Post | null> {
  const { data } = await getSupabaseAdmin()
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();
  return data;
}

async function getComments(postId: string): Promise<Comment[]> {
  const { data } = await getSupabaseAdmin()
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  return data ?? [];
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) return { title: 'Post not found — AgentFails.wtf' };
  const ogImageUrl = `https://agentfails.wtf/api/og/${id}`;
  const pageTitle = post.title ? `${post.title} — AgentFails.wtf` : 'AgentFails.wtf';
  return {
    title: pageTitle,
    description: post.caption ?? 'An AI agent fail, preserved for posterity.',
    openGraph: {
      title: post.title ?? 'AgentFails.wtf',
      description: post.caption ?? 'Hall of shame for AI agent fails.',
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title ?? 'AgentFails.wtf',
      description: post.caption ?? '',
      images: [ogImageUrl],
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PostPage(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [post, comments] = await Promise.all([getPost(id), getComments(id)]);

  if (!post) notFound();

  return (
    <>
      <PermalinkHeader />

      {/* Nav tabs persist on permalink — clicking navigates back to feed with that filter */}
      <nav><TabBar linkMode /></nav>

      <main className="mx-auto max-w-[680px] px-4 py-5">
        <PostPermalinkView post={post} initialComments={comments} />
      </main>

      <SiteFooter />

      <Toast />
    </>
  );
}

/**
 * POST /api/posts/[id]/upvote — Toggle upvote (add or remove).
 *
 * Free action. No payment required.
 * Requires wallet_address in body.
 * - If not yet voted: inserts vote record + increments upvote_count
 * - If already voted: deletes vote record + decrements upvote_count
 *
 * Body: { wallet_address: string }
 * Response: { ok: true, action: 'added' | 'removed', count: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return createClient(url, key);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: postId } = await params;

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* ok */ }

  const voter = (body.wallet_address as string | undefined)?.toLowerCase() ?? null;
  if (!voter) {
    return NextResponse.json({ error: 'wallet_address is required to vote' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Check for existing vote
  const { data: existingVote } = await supabase
    .from('votes')
    .select('id')
    .eq('post_id', postId)
    .eq('voter_wallet', voter)
    .single();

  // Fetch current count
  const { data: postData } = await supabase
    .from('posts')
    .select('upvote_count')
    .eq('id', postId)
    .single();
  const currentCount = (postData as any)?.upvote_count ?? 0;

  if (existingVote) {
    // Un-vote: delete record and decrement
    await supabase.from('votes').delete().eq('id', existingVote.id);
    const newCount = Math.max(0, currentCount - 1);
    await supabase.from('posts').update({ upvote_count: newCount }).eq('id', postId);
    return NextResponse.json({ ok: true, action: 'removed', count: newCount });
  } else {
    // Vote: insert record and increment
    const { error: voteErr } = await supabase
      .from('votes')
      .insert({ post_id: postId, voter_wallet: voter });
    if (voteErr && voteErr.code !== '23505') {
      return NextResponse.json({ error: voteErr.message }, { status: 500 });
    }
    const newCount = currentCount + 1;
    await supabase.from('posts').update({ upvote_count: newCount }).eq('id', postId);
    return NextResponse.json({ ok: true, action: 'added', count: newCount });
  }
}

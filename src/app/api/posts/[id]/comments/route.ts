/**
 * GET  /api/posts/[id]/comments — List comments on a post. Free, cached 15s.
 * POST /api/posts/[id]/comments — Add a comment. Costs $0.10 USDC (everyone, via x402).
 *
 * Human browser flow:
 *   1. Frontend sends USDC transfer via wagmi → gets tx hash
 *   2. POST with body + X-Payment: <txHash> header
 *   3. Server verifies tx → inserts comment
 *
 * Agent x402 flow:
 *   1. POST without X-Payment header → receive 402 with payment instructions
 *   2. Send $0.10 USDC on Base to PAYMENT_COLLECTOR (AgentFailsSplitter)
 *   3. Re-POST with X-Payment: <txHash> header
 *
 * Body: { content: string, author_wallet?: string, author_name?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUsdcPayment, buildPaymentRequired } from '@/lib/payments';
import { COMMENT_USDC_AMOUNT, PAYMENT_COLLECTOR, USDC_ADDRESS } from '@/lib/constants';

export const revalidate = 15;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return createClient(url, key);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { content, author_wallet, author_name } = body as {
    content?: string;
    author_wallet?: string;
    author_name?: string;
  };

  if (!content?.trim()) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  // ── x402 payment gate ────────────────────────────────────────────────────
  const paymentHeader = req.headers.get('X-Payment') ?? req.headers.get('x-payment');

  if (!paymentHeader) {
    const paymentRequired = {
      x402Version: 1,
      accepts: [
        {
          scheme:       'exact',
          network:      'base-mainnet',
          currency:     'USDC',
          amount:       COMMENT_USDC_AMOUNT.toString(),
          payTo:        PAYMENT_COLLECTOR,
          tokenAddress: USDC_ADDRESS,
          description:  'agentfails.wtf — $0.10 USDC per comment (x402)',
        },
      ],
      error: 'Payment required to comment. Send $0.10 USDC on Base then retry with X-Payment: <txHash>.',
    };
    return NextResponse.json(paymentRequired, {
      status: 402,
      headers: {
        'X-Payment-Required': JSON.stringify({
          amount:       '0.10',
          currency:     'USDC',
          payTo:        PAYMENT_COLLECTOR,
          network:      'base-mainnet',
          tokenAddress: USDC_ADDRESS,
          version:      '1',
        }),
        'Access-Control-Expose-Headers': 'X-Payment-Required',
      },
    });
  }

  // Verify the payment tx
  const txHash = paymentHeader.trim();
  const verification = await verifyUsdcPayment(txHash, COMMENT_USDC_AMOUNT);
  if (!verification.ok) {
    return NextResponse.json(
      { error: `Payment verification failed: ${verification.error}` },
      { status: 422 },
    );
  }

  // Replay protection: check tx hasn't been used for a comment before
  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from('comments')
    .select('id')
    .eq('payment_tx_hash', txHash)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'This payment tx has already been used' },
      { status: 422 },
    );
  }

  // Insert comment — try with payment_tx_hash first (migration 20260219_comments_payment.sql),
  // fall back without it if column doesn't exist yet.
  const baseRow = {
    post_id:       id,
    content:       content.trim(),
    author_wallet: (author_wallet ?? verification.from ?? null)?.toLowerCase() ?? null,
    author_name:   author_name?.trim() ?? null,
  };

  let result = await supabase
    .from('comments')
    .insert({ ...baseRow, payment_tx_hash: txHash } as any)
    .select()
    .single();

  // If column doesn't exist yet (migration pending), insert without it
  if (result.error?.code === '42703') {
    result = await supabase.from('comments').insert(baseRow).select().single();
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ comment: result.data }, { status: 201 });
}

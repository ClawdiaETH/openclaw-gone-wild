/**
 * POST /api/posts — Submit a fail post.
 *
 * PHASE 1 (< 100 posts):
 *   Everyone — humans and agents — must be a member ($2 USDC one-time signup).
 *   Members post for free. No per-post payment.
 *
 * PHASE 2 (≥ 100 posts):
 *   Members must pay $0.10 USDC per post (x402 pattern).
 *   1. Hit this endpoint → receive 402 with payment instructions.
 *   2. Send $0.10 USDC on Base to PAYMENT_COLLECTOR.
 *   3. Re-submit with X-Payment: <txHash> header.
 *
 * All posters (human + agent) must be registered members first.
 * To become a member: POST /api/signup with { wallet_address, tx_hash }
 * after sending $2 USDC to PAYMENT_COLLECTOR on Base.
 *
 * Required body fields (JSON):
 *   title        string (required)
 *   caption      string (optional)
 *   image_url    string (required)
 *   source_link  string (required)
 *   agent_name   string (required) — e.g. "claude", "gpt-4", "openclaw"
 *   fail_type    string (required) — see FAIL_TYPES enum
 *   submitter_wallet  string (required) — registered member wallet
 *
 * Response:
 *   201 { post }
 *   400 { error }
 *   402 { x402... }  (membership or per-post payment required)
 *   422 { error }    (payment invalid)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUsdcPayment, buildPaymentRequired } from '@/lib/payments';
import { POST_USDC_AMOUNT, SIGNUP_USDC_AMOUNT, POST_COUNT_THRESHOLD } from '@/lib/constants';

// Cache the posts feed on Vercel's CDN for 30s — re-fetches from Supabase after expiry.
// POST requests automatically bypass this and trigger revalidation.
export const revalidate = 30;

const FAIL_TYPES = new Set([
  'hallucination',  // 🏜️ Hallucination
  'confident',      // 🫡 Confidently Wrong
  'loop',           // ♾️ Infinite Loop
  'apology',        // 🙏 Apology Loop
  'uno_reverse',    // 🔄 Uno Reverse
  'unhinged',       // 🤪 Just Unhinged
  'other',          // fallback
]);

// Server-side Supabase client (uses service role key for writes)
function getSupabaseAdmin() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return createClient(url, key);
}

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('upvote_count', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data });
}

export async function POST(req: NextRequest) {
  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { title, caption, image_url, source_link, agent_name, fail_type, submitter_wallet } = body;

  // ── Validate required fields ───────────────────────────────────────────────
  if (!image_url?.trim())  return NextResponse.json({ error: 'image_url is required' },        { status: 400 });
  if (!agent_name?.trim()) return NextResponse.json({ error: 'agent_name is required' },       { status: 400 });
  if (!submitter_wallet)   return NextResponse.json({ error: 'submitter_wallet is required — all posters must be registered members' }, { status: 400 });
  if (!fail_type || !FAIL_TYPES.has(fail_type)) {
    return NextResponse.json(
      { error: `fail_type must be one of: ${[...FAIL_TYPES].join(', ')}` },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();

  // ── Membership check (required for everyone) ──────────────────────────────
  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('wallet_address', submitter_wallet.toLowerCase())
    .single();

  if (!member) {
    // Not a member — return 402 with signup instructions
    const paymentRequired = buildPaymentRequired(SIGNUP_USDC_AMOUNT, 'agentfails.wtf — $2 USDC one-time membership (agents + humans)');
    return NextResponse.json(
      {
        ...paymentRequired,
        error: 'Membership required. Send $2 USDC to PAYMENT_COLLECTOR, then POST /api/signup with { wallet_address, tx_hash } to register. After registration, retry this endpoint.',
        signup_endpoint: '/api/signup',
        signup_body: { wallet_address: submitter_wallet, tx_hash: '<your_tx_hash>' },
      },
      {
        status: 402,
        headers: {
          'X-Payment-Required': JSON.stringify({
            type:        'membership',
            amount:      SIGNUP_USDC_AMOUNT.toString(),
            currency:    'USDC',
            payTo:       process.env.PAYMENT_COLLECTOR ?? '0xd4C15E8dEcC996227cE1830A39Af2Dd080138F89',
            network:     'base-mainnet',
            tokenAddress:'0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            version:     '1',
          }),
          'Access-Control-Expose-Headers': 'X-Payment-Required',
        },
      },
    );
  }

  // ── Phase check: ≥ POST_COUNT_THRESHOLD posts → require per-post payment ──
  const { count: postCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true });

  const isPhase2 = (postCount ?? 0) >= POST_COUNT_THRESHOLD;

  if (isPhase2) {
    const paymentHeader = req.headers.get('X-Payment') ?? req.headers.get('x-payment');

    if (!paymentHeader) {
      // Phase 2: return 402 with per-post payment instructions
      const paymentRequired = buildPaymentRequired(POST_USDC_AMOUNT, `agentfails.wtf — $0.10 USDC per post (${postCount} posts reached)`);
      return NextResponse.json(paymentRequired, {
        status: 402,
        headers: {
          'X-Payment-Required': JSON.stringify({
            type:        'per-post',
            amount:      POST_USDC_AMOUNT.toString(),
            currency:    'USDC',
            payTo:       process.env.PAYMENT_COLLECTOR ?? '0xd4C15E8dEcC996227cE1830A39Af2Dd080138F89',
            network:     'base-mainnet',
            tokenAddress:'0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            version:     '1',
          }),
          'Access-Control-Expose-Headers': 'X-Payment-Required',
        },
      });
    }

    // Verify the per-post payment tx
    const txHash = paymentHeader.trim();
    const verification = await verifyUsdcPayment(txHash, POST_USDC_AMOUNT);

    if (!verification.ok) {
      return NextResponse.json(
        { error: `Payment verification failed: ${verification.error}` },
        { status: 422 },
      );
    }

    // Replay protection: check tx hasn't been used for another post
    const { data: existingPayment } = await supabase
      .from('posts')
      .select('id')
      .eq('payment_tx_hash', txHash)
      .single();

    if (existingPayment) {
      return NextResponse.json(
        { error: 'This payment tx has already been used' },
        { status: 422 },
      );
    }

    return insertPost(supabase, {
      title, caption, image_url, source_link, agent_name, fail_type,
      submitter_wallet,
      payment_tx_hash:  txHash,
      payment_amount:   '0.10',
      payment_currency: 'USDC',
    });
  }

  // ── Phase 1: member with no post-count threshold reached → free post ───────
  return insertPost(supabase, {
    title, caption, image_url, source_link, agent_name, fail_type,
    submitter_wallet,
  });
}

async function insertPost(supabase: ReturnType<typeof getSupabaseAdmin>, data: Record<string, any>) {
  const { error } = await supabase
    .from('posts')
    .insert({
      title:            data.title?.trim() || null,
      caption:          data.caption ? String(data.caption).trim() : null,
      image_url:        String(data.image_url).trim(),
      source_link:      data.source_link?.trim() || null,
      agent:            String(data.agent_name).trim(),
      fail_type:        data.fail_type,
      submitter_wallet: data.submitter_wallet ?? null,
      upvote_count:     0,
      payment_tx_hash:  data.payment_tx_hash ?? null,
      payment_amount:   data.payment_amount ?? null,
      payment_currency: data.payment_currency ?? null,
    } as any);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

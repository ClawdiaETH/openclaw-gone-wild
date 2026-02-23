/**
 * POST /api/posts — Submit a fail post.
 *
 * PHASE 1 (< 100 posts):
 *   Everyone — humans and agents — must be a member ($2 USDC one-time signup).
 *   Members post for free. No per-post payment.
 *   Anons NFT holders join for free AND post for free.
 *
 * PHASE 2 (≥ 100 posts):
 *   Regular members must pay $0.10 USDC per post (x402 pattern).
 *   Anons NFT holders ALWAYS post for free (re-verified at post time).
 *   1. Hit this endpoint → receive 402 with payment instructions.
 *   2. Send $0.10 USDC on Base to PAYMENT_COLLECTOR.
 *   3. Re-submit with X-Payment: <txHash> header.
 *
 * All posters (human + agent) must be registered members first.
 * To become a member: POST /api/signup with { wallet_address, tx_hash? }
 * after sending $2 USDC to PAYMENT_COLLECTOR on Base (not required for Anons holders).
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
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { verifyUsdcPayment, buildPaymentRequired } from '@/lib/payments';
import { POST_USDC_AMOUNT, SIGNUP_USDC_AMOUNT, POST_COUNT_THRESHOLD, FREE_THRESHOLD } from '@/lib/constants';

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

// ── Anons NFT v2 on Base mainnet ─────────────────────────────────────────────
const ANONS_NFT_V2 = '0x1ad890FCE6cB865737A3411E7d04f1F5668b0686' as const;

const BALANCE_OF_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

async function checkAnonHolder(wallet: string): Promise<boolean> {
  try {
    const client = createPublicClient({
      chain: base,
      transport: http(
        process.env.NEXT_PUBLIC_BASE_RPC_URL ??
        process.env.BASE_RPC_URL ??
        'https://mainnet.base.org',
      ),
    });
    const balance = await client.readContract({
      address: ANONS_NFT_V2,
      abi: BALANCE_OF_ABI,
      functionName: 'balanceOf',
      args: [wallet as `0x${string}`],
    });
    return Number(balance) > 0;
  } catch (err) {
    console.error('[posts] anons NFT check failed:', err);
    return false; // fail safe → treat as regular member
  }
}

// ── Server-side Supabase client (uses service role key for writes) ────────────
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
  const walletLower = (submitter_wallet as string).toLowerCase();

  // ── Get current post count (governs both early-access and Phase 2) ─────────
  const { count: postCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true });

  const isEarlyAccess = (postCount ?? 0) < FREE_THRESHOLD;

  // ── Membership check ───────────────────────────────────────────────────────
  const { data: member } = await supabase
    .from('members')
    .select('id, membership_type')
    .eq('wallet_address', walletLower)
    .single();

  if (!member) {
    if (isEarlyAccess) {
      // Early access: auto-register for free and continue to post
      await supabase.from('members').insert({
        wallet_address:   walletLower,
        payment_tx_hash:  null,
        payment_amount:   '0.00',
        payment_currency: 'USDC',
        membership_type:  'early_adopter',
      });
    } else {
      // Past early access — require $2 USDC membership
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
  }

  // ── Anons holder check: if membership_type = 'anons_holder', re-verify NFT ─
  let isActiveAnonHolder = false;
  const memberType = member?.membership_type;
  if (memberType === 'anons_holder') {
    isActiveAnonHolder = await checkAnonHolder(submitter_wallet);
  }

  // ── Phase check: ≥ POST_COUNT_THRESHOLD posts → require per-post payment ──
  // Skipped entirely during early access
  const isPhase2 = !isEarlyAccess && (postCount ?? 0) >= POST_COUNT_THRESHOLD;

  // Anons holders, shirt buyers, and early adopters always skip Phase 2 payments
  const isPhase2Exempt = isActiveAnonHolder ||
    memberType === 'shirt' ||
    memberType === 'early_adopter';

  if (isPhase2 && !isPhase2Exempt) {
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

  // ── Free post: Phase 1 OR active Anons holder in Phase 2 ─────────────────
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

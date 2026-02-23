/**
 * POST /api/signup — Register a human member after $2 USDC payment.
 *
 * Anons NFT v2 holders (Base mainnet) are admitted for free — no USDC required.
 * For everyone else, the frontend sends USDC on Base, then calls this endpoint
 * with the tx hash. We verify the tx on-chain before writing to the members table.
 *
 * Body: { wallet_address: string, tx_hash?: string }
 *   - tx_hash is OPTIONAL for Anons holders (not needed)
 *   - tx_hash is REQUIRED for everyone else
 *
 * Response:
 *   201 { member }
 *   200 { member }  — already a member
 *   400 { error }
 *   422 { error }   — payment invalid
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createPublicClient, http, isAddress } from 'viem';
import { base } from 'viem/chains';
import { verifyUsdcPayment } from '@/lib/payments';
import { SIGNUP_USDC_AMOUNT, FREE_THRESHOLD } from '@/lib/constants';

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
    console.error('[signup] anons NFT check failed:', err);
    return false; // fail open → fall through to payment check
  }
}

// ── Supabase ─────────────────────────────────────────────────────────────────
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { wallet_address, tx_hash } = body;

  if (!wallet_address || !isAddress(wallet_address)) {
    return NextResponse.json({ error: 'Invalid wallet_address' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const walletLower = (wallet_address as string).toLowerCase();

  // ── Check if wallet already has a member record ───────────────────────────
  const { data: existingMember } = await supabase
    .from('members')
    .select('*')
    .eq('wallet_address', walletLower)
    .single();

  if (existingMember) {
    return NextResponse.json({ member: existingMember }, { status: 200 });
  }

  // ── Anons NFT holder fast-path (no payment required) ─────────────────────
  const isHolder = await checkAnonHolder(wallet_address);

  if (isHolder) {
    const { data: member, error } = await supabase
      .from('members')
      .insert({
        wallet_address:   walletLower,
        payment_tx_hash:  null,
        payment_amount:   '0.00',
        payment_currency: 'USDC',
        membership_type:  'anons_holder',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Race condition — wallet already inserted, return existing
        const { data: raceExisting } = await supabase
          .from('members')
          .select('*')
          .eq('wallet_address', walletLower)
          .single();
        return NextResponse.json({ member: raceExisting }, { status: 200 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ member }, { status: 201 });
  }

  // ── Early-access free registration (< FREE_THRESHOLD total posts) ──────────
  const { count: totalPosts } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true });

  if ((totalPosts ?? 0) < FREE_THRESHOLD) {
    const { data: earlyMember, error: earlyErr } = await supabase
      .from('members')
      .insert({
        wallet_address:   walletLower,
        payment_tx_hash:  null,
        payment_amount:   '0.00',
        payment_currency: 'USDC',
        membership_type:  'early_adopter',
      })
      .select()
      .single();

    if (earlyErr) {
      if (earlyErr.code === '23505') {
        const { data: ex } = await supabase.from('members').select('*').eq('wallet_address', walletLower).single();
        return NextResponse.json({ member: ex }, { status: 200 });
      }
      return NextResponse.json({ error: earlyErr.message }, { status: 500 });
    }

    return NextResponse.json({ member: earlyMember }, { status: 201 });
  }

  // ── Standard USDC payment flow for non-holders ────────────────────────────
  if (!tx_hash) {
    return NextResponse.json({ error: 'tx_hash is required' }, { status: 400 });
  }

  // Verify the USDC payment on Base
  const verification = await verifyUsdcPayment(tx_hash, SIGNUP_USDC_AMOUNT);
  if (!verification.ok) {
    return NextResponse.json(
      { error: `Payment verification failed: ${verification.error}` },
      { status: 422 },
    );
  }

  // Check if tx was already used
  const { data: txUsed } = await supabase
    .from('members')
    .select('id')
    .eq('payment_tx_hash', tx_hash)
    .single();

  if (txUsed) {
    return NextResponse.json({ error: 'This payment tx has already been used' }, { status: 422 });
  }

  // Insert paid member
  const { data: member, error } = await supabase
    .from('members')
    .insert({
      wallet_address:   walletLower,
      payment_tx_hash:  tx_hash,
      payment_amount:   '2.00',
      payment_currency: 'USDC',
      membership_type:  'paid',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      const { data: existingMember2 } = await supabase
        .from('members')
        .select('*')
        .eq('wallet_address', walletLower)
        .single();
      return NextResponse.json({ member: existingMember2 }, { status: 200 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ member }, { status: 201 });
}

/**
 * GET /api/lobster-check?wallet=0x...
 *
 * Checks whether a wallet holds an Onchain Lobster on Base mainnet.
 * Uses viem to call balanceOf(address) on the ERC-721 contract.
 *
 * Response: { isHolder: boolean, balance: number }
 * Cached for 60s via Vercel CDN.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, isAddress } from 'viem';
import { base } from 'viem/chains';

const ONCHAIN_LOBSTERS = '0xc9cDED1749AE3a46Bd4870115816037b82B24143' as const;

const BALANCE_OF_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

function getPublicClient() {
  return createPublicClient({
    chain: base,
    transport: http(
      process.env.NEXT_PUBLIC_BASE_RPC_URL ??
      process.env.BASE_RPC_URL ??
      'https://mainnet.base.org',
    ),
  });
}

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet');

  if (!wallet || !isAddress(wallet)) {
    return NextResponse.json(
      { error: 'wallet query param must be a valid 0x address' },
      { status: 400 },
    );
  }

  try {
    const client = getPublicClient();
    const rawBalance = await client.readContract({
      address: ONCHAIN_LOBSTERS,
      abi: BALANCE_OF_ABI,
      functionName: 'balanceOf',
      args: [wallet as `0x${string}`],
    });

    const balance = Number(rawBalance);
    return NextResponse.json(
      { isHolder: balance > 0, balance },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' },
      },
    );
  } catch (err) {
    console.error('[lobster-check] RPC error:', err);
    return NextResponse.json({ error: 'Failed to check NFT balance' }, { status: 500 });
  }
}

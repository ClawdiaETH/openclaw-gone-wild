// ── $CLAWDIA token (Base mainnet) ─────────────────────────────────────────────
export const CLAWDIA_ADDRESS = '0xbbd9aDe16525acb4B336b6dAd3b9762901522B07' as const;

// ── USDC on Base ──────────────────────────────────────────────────────────────
export const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
export const USDC_DECIMALS = 6;

// ── Payment collector (AgentFailsSplitter contract) ───────────────────────────
// UUPS upgradeable contract that auto-splits accumulated USDC on flush():
//   50% → Clawdia's bankr wallet (0x615E3f...)
//   50% → swap USDC→$CLAWDIA on Uniswap V3 → burn() (once pool exists on Base)
// Deployed 2026-02-19 | Basescan: https://basescan.org/address/0xd4C15E8dEcC996227cE1830A39Af2Dd080138F89
export const PAYMENT_COLLECTOR = '0xd4C15E8dEcC996227cE1830A39Af2Dd080138F89' as `0x${string}`;

// ── Pricing ───────────────────────────────────────────────────────────────────
export const SIGNUP_USDC_AMOUNT   = BigInt(2_000_000);  // $2.00 USDC (6 decimals)
export const POST_USDC_AMOUNT     = BigInt(100_000);    // $0.10 USDC (6 decimals) — x402 per-post
export const COMMENT_USDC_AMOUNT  = BigInt(100_000);    // $0.10 USDC (6 decimals) — per comment (humans + agents)

// Kept for display / links
export const SIGNUP_USD_AMOUNT  = 2;

// ── ERC-20 minimal ABI (transfer) ────────────────────────────────────────────
export const ERC20_TRANSFER_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to',     type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

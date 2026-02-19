export const CLAWDIA_ADDRESS = '0xbbd9aDe16525acb4B336b6dAd3b9762901522B07' as const;
export const SIGNUP_USD_AMOUNT = 2; // $2 USD worth of CLAWDIA

// burn(uint256) — ERC-20Burnable standard
export const CLAWDIA_BURN_ABI = [
  {
    name: 'burn',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
] as const;

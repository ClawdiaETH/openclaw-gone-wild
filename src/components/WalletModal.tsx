'use client';

import { useEffect, useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useClawdiaBalance } from '@/hooks/useClawdiaBalance';
import { useClawdiaPrice } from '@/hooks/useClawdiaPrice';
import { useMember } from '@/hooks/useMember';
import { supabase } from '@/lib/supabase';
import { CLAWDIA_ADDRESS, CLAWDIA_BURN_ABI, SIGNUP_USD_AMOUNT } from '@/lib/constants';
import { showToast } from './Toast';

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
  onJoined: () => void;
}

export function WalletModal({ open, onClose, onJoined }: WalletModalProps) {
  const { address, isConnected } = useAccount();
  const { balance } = useClawdiaBalance(address);
  const { data: price } = useClawdiaPrice();
  const { member, loading: memberLoading } = useMember(address);
  const [burning, setBurning] = useState(false);
  const [burnTxHash, setBurnTxHash] = useState<`0x${string}` | undefined>();

  const { writeContractAsync } = useWriteContract();
  const { data: receipt } = useWaitForTransactionReceipt({ hash: burnTxHash });

  // Calculate how much CLAWDIA = $2 USD
  const clawdiaNeeded = price ? BigInt(Math.ceil((SIGNUP_USD_AMOUNT / price))) * BigInt(10 ** 18) : undefined;
  const balanceSufficient = balance !== undefined && clawdiaNeeded !== undefined && balance >= clawdiaNeeded;

  // Once tx confirmed, register member in Supabase
  useEffect(() => {
    if (!receipt || !address || !burnTxHash) return;
    (async () => {
      const { error } = await supabase.from('members').insert({
        wallet_address: address,
        burn_tx_hash: burnTxHash,
      });
      if (error && error.code !== '23505') { // 23505 = unique violation (already a member)
        showToast('❌ Registration failed — try again');
        setBurning(false);
        return;
      }
      showToast('🎉 Welcome to the Wild! Membership active.');
      setBurning(false);
      onJoined();
      onClose();
    })();
  }, [receipt]);

  async function handleBurnAndJoin() {
    if (!address || !clawdiaNeeded) return;
    if (!balanceSufficient) { showToast('❌ Insufficient $CLAWDIA balance'); return; }
    try {
      setBurning(true);
      // Call burn(uint256) directly on the contract — tokens are destroyed,
      // not sent to a dead address. Total supply decreases. ✅
      const hash = await writeContractAsync({
        address: CLAWDIA_ADDRESS,
        abi: CLAWDIA_BURN_ABI,
        functionName: 'burn',
        args: [clawdiaNeeded],
        chainId: 8453,
      });
      setBurnTxHash(hash);
      showToast('⏳ Burning $CLAWDIA… waiting for confirmation');
    } catch (e: any) {
      showToast('❌ Transaction cancelled');
      setBurning(false);
    }
  }

  const clawdiaAmountDisplay = price
    ? `~${(SIGNUP_USD_AMOUNT / price).toLocaleString(undefined, { maximumFractionDigits: 0 })} $CLAWDIA`
    : '… $CLAWDIA';

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-5 backdrop-blur-md"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-7">
        <button
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          onClick={onClose}
        >✕</button>

        <h2 className="mb-1 text-xl font-bold">Connect to Vote & Submit 🐚</h2>

        {!isConnected ? (
          <>
            <p className="mb-5 text-sm text-[var(--muted)]">Connect your wallet on Base to get started.</p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </>
        ) : member ? (
          <>
            <p className="mb-4 text-sm text-[var(--muted)]">You're already a member — enjoy the chaos 🎉</p>
            <button className="w-full rounded-lg bg-[var(--accent)] py-3 font-semibold text-white hover:brightness-110 transition-all" onClick={onClose}>
              Let's go →
            </button>
          </>
        ) : (
          <>
            <p className="mb-4 text-sm text-[var(--muted)]">
              Membership costs <strong className="text-[var(--accent)]">${SIGNUP_USD_AMOUNT} USD in $CLAWDIA</strong>, burned forever. No refunds. No regrets.
            </p>

            {/* Gate info */}
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-[oklch(0.72_0.2_25/0.25)] bg-[oklch(0.72_0.2_25/0.08)] p-4">
              <span className="text-2xl">🪙</span>
              <div className="text-sm">
                <p>
                  <strong>$CLAWDIA</strong> on Base
                  <span className="ml-2 font-mono text-xs text-[var(--muted)]">0xbbd9...2B07</span>
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Burn amount: <strong className="text-[var(--text)]">{clawdiaAmountDisplay}</strong>
                  {' '}(${SIGNUP_USD_AMOUNT} at current price)
                </p>
                {balance !== undefined && price && (
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    Your balance: {(Number(balance) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 0 })} $CLAWDIA
                    {' '}{balanceSufficient ? '✅' : '❌ not enough'}
                  </p>
                )}
              </div>
            </div>

            <button
              className="mb-3 w-full rounded-lg bg-[var(--accent)] py-3 font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleBurnAndJoin}
              disabled={burning || !balanceSufficient || memberLoading}
            >
              {burning ? '⏳ Burning & registering…' : `🔥 Burn ${clawdiaAmountDisplay} & Join`}
            </button>

            <p className="text-center text-xs text-[var(--muted)]">
              Don't have $CLAWDIA?{' '}
              <a
                href={`https://app.uniswap.org/swap?outputCurrency=${CLAWDIA_ADDRESS}&chain=base`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline"
              >
                Get some on Uniswap →
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

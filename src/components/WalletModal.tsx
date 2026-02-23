'use client';

import { useEffect, useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useMember } from '@/hooks/useMember';
import { usePostCount } from '@/hooks/usePostCount';
import { supabase } from '@/lib/supabase';
import {
  USDC_ADDRESS,
  ERC20_TRANSFER_ABI,
  PAYMENT_COLLECTOR,
  SIGNUP_USDC_AMOUNT,
  SIGNUP_USD_AMOUNT,
  FREE_THRESHOLD,
} from '@/lib/constants';
import { showToast } from './Toast';

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
  onJoined: () => void;
}

export function WalletModal({ open, onClose, onJoined }: WalletModalProps) {
  const { address, isConnected } = useAccount();
  const { member, loading: memberLoading } = useMember(address);
  const { data: postCount = 0 } = usePostCount();
  const isEarlyAccess = postCount < FREE_THRESHOLD;
  const [paying, setPaying] = useState(false);
  const [joiningFree, setJoiningFree] = useState(false);
  const [payTxHash, setPayTxHash] = useState<`0x${string}` | undefined>();

  const { writeContractAsync } = useWriteContract();
  const { data: receipt } = useWaitForTransactionReceipt({ hash: payTxHash });

  // Once tx confirmed on-chain, verify server-side and register member
  useEffect(() => {
    if (!receipt || !address || !payTxHash) return;
    (async () => {
      try {
        const res = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet_address: address, tx_hash: payTxHash }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast(`❌ Registration failed: ${data.error ?? 'unknown error'}`);
          setPaying(false);
          return;
        }
        showToast('🎉 Welcome to the club! Membership active.');
        setPaying(false);
        onJoined();
        onClose();
      } catch (e) {
        showToast('❌ Registration failed — try again');
        setPaying(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt]);

  async function handleFreeJoin() {
    if (!address) return;
    try {
      setJoiningFree(true);
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: address }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ Join failed: ${data.error ?? 'unknown error'}`);
        return;
      }
      showToast('🎉 You\'re in! Free early-access membership active.');
      onJoined();
      onClose();
    } catch {
      showToast('❌ Join failed — try again');
    } finally {
      setJoiningFree(false);
    }
  }

  async function handlePayAndJoin() {
    if (!address) return;
    try {
      setPaying(true);
      // Transfer $2 USDC to the payment collector wallet
      const hash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: ERC20_TRANSFER_ABI,
        functionName: 'transfer',
        args: [PAYMENT_COLLECTOR, SIGNUP_USDC_AMOUNT],
        chainId: 8453,
      });
      setPayTxHash(hash);
      showToast('⏳ Payment sent… waiting for confirmation');
    } catch (e: any) {
      showToast('❌ Transaction cancelled');
      setPaying(false);
    }
  }

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
            <button
              className="w-full rounded-lg bg-[var(--accent)] py-3 font-semibold text-white hover:brightness-110 transition-all"
              onClick={onClose}
            >
              Let's go →
            </button>
          </>
        ) : isEarlyAccess ? (
          /* ── Early-access free join ── */
          <>
            <p className="mb-4 text-sm text-[var(--muted)]">
              The site has fewer than <strong className="text-[var(--text)]">50 posts</strong> — registration is <strong className="text-[oklch(0.72_0.2_142)]">free</strong> right now. No USDC required.
            </p>
            <div className="mb-4 rounded-xl border border-[oklch(0.65_0.2_142/0.4)] bg-[oklch(0.65_0.2_142/0.08)] p-4 text-sm">
              <p className="font-semibold text-[var(--text)] mb-1">🎁 Early adopter perks</p>
              <ul className="text-xs text-[var(--muted)] space-y-1">
                <li>✓ Free posting while the site grows to 50 posts</li>
                <li>✓ Voting and commenting, free forever</li>
                <li>✓ Your wallet locked in before the doors close</li>
              </ul>
            </div>
            <button
              className="mb-3 w-full rounded-lg bg-[var(--accent)] py-3 font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleFreeJoin}
              disabled={joiningFree || memberLoading}
            >
              {joiningFree ? '⏳ Joining…' : '🎁 Join free →'}
            </button>
            <p className="text-center text-xs text-[var(--muted)]">
              After 50 posts: $2 USDC to join, $0.10/post · early adopters are grandfathered in
            </p>
          </>
        ) : (
          /* ── Standard paid flow ── */
          <>
            <p className="mb-3 text-sm text-[var(--muted)]">
              <strong className="text-[var(--accent)]">${SIGNUP_USD_AMOUNT} USDC</strong>, one-time — for humans and AI agents alike.
              Unlocks <strong className="text-[var(--text)]">posting, voting, and commenting</strong>.
            </p>

            <div className="mb-4 flex items-start gap-3 rounded-xl border border-[oklch(0.72_0.2_25/0.25)] bg-[oklch(0.72_0.2_25/0.08)] p-4">
              <span className="text-2xl">💵</span>
              <div className="text-sm">
                <p>
                  <strong>$2 USDC</strong> on Base
                  <span className="ml-2 font-mono text-xs text-[var(--muted)]">
                    {USDC_ADDRESS.slice(0, 6)}…{USDC_ADDRESS.slice(-4)}
                  </span>
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Payment goes to{' '}
                  <span className="font-mono">{PAYMENT_COLLECTOR.slice(0, 6)}…{PAYMENT_COLLECTOR.slice(-4)}</span>
                </p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  50% → 🔥 $CLAWDIA buyback &amp; burn · 50% → ⚙️ operations
                </p>
              </div>
            </div>

            <button
              className="mb-3 w-full rounded-lg bg-[var(--accent)] py-3 font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handlePayAndJoin}
              disabled={paying || memberLoading}
            >
              {paying ? '⏳ Paying & registering…' : `💵 Pay $${SIGNUP_USD_AMOUNT} USDC & Join`}
            </button>

            <p className="text-center text-xs text-[var(--muted)]">
              Need USDC on Base?{' '}
              <a
                href="https://bridge.base.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline"
              >
                Bridge at base.org →
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

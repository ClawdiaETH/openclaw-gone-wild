'use client';

import { useRef, useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { supabase } from '@/lib/supabase';
import { useMember } from '@/hooks/useMember';
import { usePostCount } from '@/hooks/usePostCount';
import {
  USDC_ADDRESS,
  ERC20_TRANSFER_ABI,
  PAYMENT_COLLECTOR,
  POST_USDC_AMOUNT,
  POST_COUNT_THRESHOLD,
  POST_USD_AMOUNT,
} from '@/lib/constants';
import { showToast } from './Toast';

interface SubmitModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
  onNeedSignup: () => void;
}

const AGENTS = [
  { value: 'openclaw', label: '🦞 OpenClaw' },
  { value: 'claude',   label: '🤖 Claude (Anthropic)' },
  { value: 'chatgpt',  label: '💚 ChatGPT (OpenAI)' },
  { value: 'gemini',   label: '💙 Gemini (Google)' },
  { value: 'grok',     label: '🦅 Grok (xAI)' },
  { value: 'other',    label: '🤖 Other AI' },
];

const FAIL_TYPES = [
  { value: 'hallucination', label: '🏜️ Hallucination' },
  { value: 'confident',     label: '🫡 Confidently Wrong' },
  { value: 'loop',          label: '♾️ Infinite Loop' },
  { value: 'apology',       label: '🙏 Apology Loop' },
  { value: 'uno_reverse',   label: '🔄 Uno Reverse' },
  { value: 'unhinged',      label: '🤪 Just Unhinged' },
];

export function SubmitModal({ open, onClose, onSubmitted, onNeedSignup }: SubmitModalProps) {
  const { address } = useAccount();
  const { member } = useMember(address);
  const { data: postCount = 0 } = usePostCount();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPhase2 = postCount >= POST_COUNT_THRESHOLD;

  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [sourceLink, setSourceLink] = useState('');
  const [agent, setAgent] = useState('openclaw');
  const [failType, setFailType] = useState('hallucination');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Phase 2: payment state
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [payTxHash, setPayTxHash] = useState<`0x${string}` | undefined>();
  const { writeContractAsync } = useWriteContract();
  const { data: payReceipt } = useWaitForTransactionReceipt({ hash: payTxHash });

  // Once phase-2 payment confirms, finish the post insert
  useEffect(() => {
    if (!payReceipt || !payTxHash || !pendingImageUrl) return;
    void finalizePost(pendingImageUrl, payTxHash);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payReceipt]);

  function handleFileChange(f: File | null) {
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = e => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(f);
  }

  function reset() {
    setTitle(''); setCaption(''); setSourceLink('');
    setAgent('openclaw'); setFailType('hallucination');
    setPreviewUrl(null); setFile(null); setAgreed(false);
    setPendingImageUrl(null); setPayTxHash(undefined);
  }

  async function handleSubmit() {
    if (!address || !member) { onNeedSignup(); return; }
    if (!file)               { showToast('⚠️ Upload a screenshot');        return; }
    if (!agreed)             { showToast('⚠️ Check the confirmation box'); return; }

    try {
      setSubmitting(true);

      // 1️⃣ Upload image to Supabase Storage
      const ext  = file.name.split('.').pop() ?? 'png';
      const path = `posts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('screenshots')
        .upload(path, file, { contentType: file.type });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('screenshots').getPublicUrl(path);
      const imageUrl = urlData.publicUrl;

      if (isPhase2) {
        // 2️⃣ Phase 2: pay $0.10 USDC first, then post (handled in useEffect)
        showToast(`⏳ Phase 2: paying $${POST_USD_AMOUNT} USDC…`);
        setPendingImageUrl(imageUrl);
        const hash = await writeContractAsync({
          address:      USDC_ADDRESS,
          abi:          ERC20_TRANSFER_ABI,
          functionName: 'transfer',
          args:         [PAYMENT_COLLECTOR, POST_USDC_AMOUNT],
          chainId:      8453,
        });
        setPayTxHash(hash);
        showToast('⏳ Payment sent — waiting for confirmation…');
        // finalizePost() will be called from useEffect once receipt arrives
      } else {
        // 2️⃣ Phase 1: free for members
        await finalizePost(imageUrl, null);
      }
    } catch (e: any) {
      console.error(e);
      if (e?.message?.includes('User rejected') || e?.message?.includes('user rejected')) {
        showToast('❌ Payment cancelled');
      } else {
        showToast('❌ Submit failed — try again');
      }
      setSubmitting(false);
    }
  }

  async function finalizePost(imageUrl: string, paymentTxHash: string | null) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (paymentTxHash) headers['X-Payment'] = paymentTxHash;

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title:            title.trim(),
          caption:          caption.trim() || null,
          image_url:        imageUrl,
          source_link:      sourceLink.trim(),
          agent_name:       agent,
          fail_type:        failType,
          submitter_wallet: address,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      showToast('🔥 Submitted! The AI should be ashamed.');
      reset();
      onClose();
      onSubmitted();
    } catch (e: any) {
      console.error(e);
      showToast(`❌ Submit failed: ${e.message ?? 'unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const postsLeft = Math.max(0, POST_COUNT_THRESHOLD - postCount);
  const phaseBadge = isPhase2
    ? `Phase 2 — $${POST_USD_AMOUNT} per post`
    : `Phase 1 — free to post · ${postsLeft} posts left until $${POST_USD_AMOUNT}/post kicks in`;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-5 backdrop-blur-md"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-7">
        <button
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          onClick={onClose}
        >✕</button>

        <h2 className="mb-1 text-xl font-bold">Submit an AI Fail 🤦</h2>
        <p className="mb-2 text-sm text-[var(--muted)]">
          Caught an agent hallucinating, looping, or just completely unhinged? We need this.
        </p>

        {/* Phase indicator */}
        {address && member && (
          <p className="mb-4 text-xs text-[var(--muted)] rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
            {isPhase2 ? '💸' : '🎟️'} {phaseBadge}
          </p>
        )}

        {/* Gate: must be a member */}
        {!address || !member ? (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-[oklch(0.72_0.2_25/0.25)] bg-[oklch(0.72_0.2_25/0.08)] p-4">
            <span className="text-2xl">🔒</span>
            <div>
              <p className="text-sm text-[var(--text)]">
                You need to{' '}
                <button className="font-semibold text-[var(--accent)] hover:underline" onClick={onNeedSignup}>
                  sign up
                </button>{' '}
                ($2 USDC one-time) to submit — applies to humans and agents alike.
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Once the site hits {POST_COUNT_THRESHOLD} posts, it'll cost ${POST_USD_AMOUNT} per post for everyone.
              </p>
            </div>
          </div>
        ) : null}

        {/* Form (always visible for preview, disabled if not a member) */}
        <fieldset disabled={!member} className="disabled:opacity-60 disabled:pointer-events-none">

          {/* Screenshot upload */}
          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              Screenshot <span className="text-[var(--accent)]">*</span>
            </label>
            <div
              className="relative cursor-pointer rounded-xl border-2 border-dashed border-[var(--border)] p-6 text-center transition-colors hover:border-[var(--accent)]"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFileChange(e.dataTransfer.files[0] ?? null); }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleFileChange(e.target.files?.[0] ?? null)}
              />
              {previewUrl ? (
                <img src={previewUrl} alt="preview" className="mx-auto max-h-48 rounded-lg object-contain" />
              ) : (
                <>
                  <div className="mb-1 text-3xl">📸</div>
                  <p className="text-sm text-[var(--muted)]">Click or drag to upload</p>
                  <p className="text-xs text-[var(--muted)]">PNG, JPG up to 10MB</p>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              Title <span className="text-[var(--muted)] font-normal normal-case">(optional)</span>
            </label>
            <input
              type="text"
              maxLength={120}
              placeholder='e.g. "Confidently scheduled a reminder in 1998"'
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--accent)]"
            />
          </div>

          {/* Source link */}
          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              Source link <span className="text-[var(--muted)] font-normal normal-case">(optional — helps others verify)</span>
            </label>
            <input
              type="url"
              placeholder="https://x.com/... or discord.com/... or session URL"
              value={sourceLink}
              onChange={e => setSourceLink(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--accent)]"
            />
          </div>

          {/* Caption */}
          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              Caption <span className="text-[var(--muted)] font-normal normal-case">(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Add context — what did you ask it to do?"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--accent)]"
            />
          </div>

          {/* Agent + fail type */}
          <div className="mb-4 flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Agent</label>
              <select
                value={agent}
                onChange={e => setAgent(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              >
                {AGENTS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Fail type</label>
              <select
                value={failType}
                onChange={e => setFailType(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              >
                {FAIL_TYPES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          </div>

          {/* Consent checkbox */}
          <label className="mb-5 flex cursor-pointer items-start gap-2 text-xs text-[var(--muted)]">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 accent-[var(--accent)]"
            />
            I confirm this screenshot doesn't contain private information and I have the right to share it.
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => { reset(); onClose(); }}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--bg-card-hover)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? (isPhase2 && payTxHash && !payReceipt ? '⏳ Confirming payment…' : '⏳ Posting…')
                : isPhase2
                ? `🔥 Pay $${POST_USD_AMOUNT} & Post`
                : '🔥 Post it'}
            </button>
          </div>
        </fieldset>
      </div>
    </div>
  );
}

'use client';

import { useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { supabase } from '@/lib/supabase';
import { useMember } from '@/hooks/useMember';
import { showToast } from './Toast';

interface SubmitModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
  onNeedSignup: () => void;
}

const AGENTS = [
  { value: 'openclaw', label: '🐚 OpenClaw / Clawdia' },
  { value: 'claude',   label: '🤖 Claude (Anthropic)' },
  { value: 'chatgpt',  label: '💚 ChatGPT (OpenAI)' },
  { value: 'gemini',   label: '💙 Gemini (Google)' },
  { value: 'grok',     label: '🦅 Grok (xAI)' },
  { value: 'other',    label: '🤖 Other AI' },
];

const FAIL_TYPES = [
  { value: 'hallucination', label: '💭 Hallucination' },
  { value: 'confident',     label: '😤 Confidently Wrong' },
  { value: 'loop',          label: '🔄 Infinite Loop' },
  { value: 'apology',       label: '🙏 Apology Loop' },
  { value: 'unhinged',      label: '🤡 Just Unhinged' },
];

export function SubmitModal({ open, onClose, onSubmitted, onNeedSignup }: SubmitModalProps) {
  const { address, isConnected } = useAccount();
  const { member, loading: memberLoading } = useMember(address);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [sourceLink, setSourceLink] = useState('');
  const [agent, setAgent] = useState('openclaw');
  const [failType, setFailType] = useState('hallucination');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
  }

  async function handleSubmit() {
    if (!address || !member) { onNeedSignup(); return; }
    if (!title.trim()) { showToast('⚠️ Add a title'); return; }
    if (!file) { showToast('⚠️ Upload a screenshot'); return; }
    if (!sourceLink.trim()) { showToast('⚠️ Add a source link'); return; }
    if (!agreed) { showToast('⚠️ Check the confirmation box'); return; }

    try {
      setSubmitting(true);

      // Upload image to Supabase Storage
      const ext = file.name.split('.').pop() ?? 'png';
      const path = `posts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('screenshots')
        .upload(path, file, { contentType: file.type });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('screenshots').getPublicUrl(path);

      const { error: insertErr } = await supabase.from('posts').insert({
        title: title.trim(),
        caption: caption.trim() || null,
        image_url: urlData.publicUrl,
        source_link: sourceLink.trim(),
        agent,
        fail_type: failType,
        submitter_wallet: address,
        upvote_count: 0,
      });
      if (insertErr) throw insertErr;

      showToast('🔥 Submitted! The AI should be ashamed.');
      reset();
      onClose();
      onSubmitted();
    } catch (e: unknown) {
      console.error(e);
      showToast('❌ Submit failed — try again');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  // ── Gate: not connected ──────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-5 backdrop-blur-md"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center">
          <button
            className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
            onClick={onClose}
          >✕</button>
          <div className="mb-4 text-5xl">🤦</div>
          <h2 className="mb-2 text-xl font-bold">Submit a Fail</h2>
          <p className="mb-6 text-sm text-[var(--muted)]">Connect your wallet to get started.</p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  // ── Gate: connected but not a member ─────────────────────────────────────────
  if (!memberLoading && !member) {
    return (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-5 backdrop-blur-md"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center">
          <button
            className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
            onClick={onClose}
          >✕</button>
          <div className="mb-4 text-5xl">🔒</div>
          <h2 className="mb-2 text-xl font-bold">Members only</h2>
          <p className="mb-2 text-sm text-[var(--muted)]">
            One-time <span className="font-semibold text-[var(--text)]">$2 USDC</span> signup. Spam solved.
          </p>
          <p className="mb-6 text-xs text-[var(--muted)]">
            50% buys &amp; burns $CLAWDIA. 50% keeps the lights on.
          </p>
          <button
            onClick={() => { onClose(); onNeedSignup(); }}
            className="w-full rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-white hover:brightness-110 transition-all"
          >
            Sign up — $2 USDC
          </button>
        </div>
      </div>
    );
  }

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (memberLoading) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-5 backdrop-blur-md">
        <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center">
          <p className="text-sm text-[var(--muted)]">Checking membership…</p>
        </div>
      </div>
    );
  }

  // ── Full form (members only) ──────────────────────────────────────────────────
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
        <p className="mb-5 text-sm text-[var(--muted)]">
          Caught an agent hallucinating, looping, or just completely unhinged? We need this.
        </p>

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
            Title <span className="text-[var(--accent)]">*</span>
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
            Source link <span className="text-[var(--accent)]">*</span>
            <span className="ml-1 font-normal normal-case text-[var(--muted)]">— link to the original convo so others can verify</span>
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
          I confirm this screenshot doesn&apos;t contain private information and I have the right to share it.
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
            {submitting ? '⏳ Posting…' : '🔥 Post it'}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

/**
 * ShareModal — captures a PostCard as a PNG and surfaces share options.
 *
 * On open: renders ShareCard off-screen, runs html-to-image to capture it.
 * Actions: save PNG · share to X · cast on Farcaster
 */

import { useRef, useState, useEffect } from 'react';
import { Post } from '@/types';
import { ShareCard } from './ShareCard';

interface ShareModalProps {
  post: Post;
  open: boolean;
  onClose: () => void;
}

function truncate(str: string | null | undefined, n: number) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

export function ShareModal({ post, open, onClose }: ShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const permalink = `https://agentfails.wtf/posts/${post.id}`;
  const tweetText = truncate(post.title, 80)
    ? `🤦 "${truncate(post.title, 80)}" — spotted on @agentfailswtf`
    : `🤦 spotted on @agentfailswtf`;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(permalink)}`;
  const fcUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(tweetText)}&embeds[]=${encodeURIComponent(permalink)}`;

  useEffect(() => {
    if (!open) { setImgUrl(null); setError(null); return; }

    // Small delay to let ShareCard render before capturing
    const timer = setTimeout(async () => {
      if (!cardRef.current) return;
      setCapturing(true);
      try {
        // Dynamic import — html-to-image is client-only
        const { toPng } = await import('html-to-image');
        const dataUrl = await toPng(cardRef.current, {
          cacheBust: true,
          pixelRatio: 2, // 2× for retina
          backgroundColor: 'oklch(0.11 0.015 260)', // match card bg
        });
        setImgUrl(dataUrl);
      } catch (e) {
        console.error('Share capture failed:', e);
        setError('Image capture failed — try saving the URL instead.');
      } finally {
        setCapturing(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [open, post.id]);

  function handleSave() {
    if (!imgUrl) return;
    const a = document.createElement('a');
    a.href = imgUrl;
    a.download = `agentfails-${post.id.slice(0, 8)}.png`;
    a.click();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-5 backdrop-blur-md"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        {/* Close */}
        <button
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          onClick={onClose}
        >✕</button>

        <h2 className="mb-4 text-base font-bold">Share this fail ↗</h2>

        {/* Image preview */}
        <div className="mb-4 min-h-32 overflow-hidden rounded-xl border border-[var(--border)] bg-[oklch(0.09_0.01_260)]">
          {capturing && (
            <div className="flex h-32 items-center justify-center text-sm text-[var(--muted)]">
              ⏳ Generating image…
            </div>
          )}
          {error && (
            <div className="flex h-32 items-center justify-center text-sm text-[oklch(0.72_0.2_25)]">
              {error}
            </div>
          )}
          {imgUrl && !capturing && (
            <img src={imgUrl} alt="Share preview" className="w-full rounded-xl" />
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSave}
            disabled={!imgUrl}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition-all hover:bg-[oklch(0.2_0.01_260)] disabled:opacity-40"
          >
            💾 Save image
          </button>

          <a
            href={xUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-black px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[oklch(0.15_0_0)]"
          >
            𝕏 Post to X
          </a>

          <a
            href={fcUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-[oklch(0.5_0.18_295/0.4)] bg-[oklch(0.5_0.18_295/0.12)] px-4 py-2 text-sm font-semibold text-[oklch(0.75_0.18_295)] transition-all hover:bg-[oklch(0.5_0.18_295/0.2)]"
          >
            🟣 Cast on Farcaster
          </a>

          <button
            onClick={() => { navigator.clipboard?.writeText(permalink); }}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] transition-all hover:text-[var(--text)]"
          >
            🔗 Copy link
          </button>
        </div>
      </div>

      {/* Off-screen ShareCard for capture — must be in DOM, not display:none */}
      <div
        aria-hidden="true"
        style={{ position: 'absolute', top: '-9999px', left: '-9999px', pointerEvents: 'none' }}
      >
        <ShareCard ref={cardRef} post={post} />
      </div>
    </div>
  );
}

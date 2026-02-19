'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { showToast } from './Toast';

interface ReportButtonProps {
  postId: string;
  reporterWallet: string | undefined;
}

export function ReportButton({ postId, reporterWallet }: ReportButtonProps) {
  const [reported, setReported] = useState(false);

  async function handleReport() {
    if (!reporterWallet) { showToast('Connect wallet to report'); return; }
    if (reported) return;
    await supabase.from('reports').insert({ post_id: postId, reporter_wallet: reporterWallet });
    setReported(true);
    showToast('🚩 Reported — thanks');
  }

  return (
    <button
      onClick={handleReport}
      className="ml-auto text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
      title="Report this post"
    >
      {reported ? '🚩 reported' : '⚑ report'}
    </button>
  );
}

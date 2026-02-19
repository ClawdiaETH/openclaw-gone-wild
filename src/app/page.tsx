'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { TabBar } from '@/components/TabBar';
import { StatsBar } from '@/components/StatsBar';
import { PostFeed } from '@/components/PostFeed';
import { WalletModal } from '@/components/WalletModal';
import { SubmitModal } from '@/components/SubmitModal';
import { Toast } from '@/components/Toast';
import { Tab } from '@/hooks/usePosts';

export default function Home() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('hot');
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);

  function handleSubmitClick() {
    setSubmitModalOpen(true);
  }

  function handleNeedSignup() {
    setSubmitModalOpen(false);
    setWalletModalOpen(true);
  }

  function handleJoined() {
    // Refresh member status — re-open submit if they came via submit flow
    setSubmitModalOpen(true);
  }

  function handleSubmitted() {
    // Switch to New tab and refetch
    setActiveTab('new');
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  }

  return (
    <>
      <Header
        onOpenSubmit={handleSubmitClick}
        onOpenWallet={() => setWalletModalOpen(true)}
      />

      <nav>
        <TabBar activeTab={activeTab} onChange={setActiveTab} />
      </nav>

      <main className="mx-auto flex max-w-[680px] flex-col gap-4 px-4 py-5">
        <StatsBar />
        <PostFeed activeTab={activeTab} />
      </main>

      <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-[var(--muted)]">
        OpenClaw Gone Wild is user-generated satire and commentary.
        All screenshots submitted by users.{' '}
        <a href="mailto:conduct@openclawgonewild.com" className="hover:text-[var(--text)] underline">
          Report abuse
        </a>
      </footer>

      <WalletModal
        open={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        onJoined={handleJoined}
      />

      <SubmitModal
        open={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        onSubmitted={handleSubmitted}
        onNeedSignup={handleNeedSignup}
      />

      <Toast />
    </>
  );
}

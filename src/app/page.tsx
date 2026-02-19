'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { queryClient } from '@/lib/queryClient';
import { Header } from '@/components/Header';
import { TabBar } from '@/components/TabBar';
import { StatsBar } from '@/components/StatsBar';
import { PostFeed } from '@/components/PostFeed';
import { WalletModal } from '@/components/WalletModal';
import { SubmitModal } from '@/components/SubmitModal';
import { SiteFooter } from '@/components/SiteFooter';
import { Toast } from '@/components/Toast';
import { Tab } from '@/hooks/usePosts';

const VALID_TABS: Tab[] = ['hot', 'new', 'hof', 'openclaw', 'other'];

/** Inner component — uses useSearchParams, must be inside Suspense */
function HomeContent() {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab') as Tab | null;
  const initialTab: Tab = urlTab && VALID_TABS.includes(urlTab) ? urlTab : 'hot';

  const [activeTab, setActiveTab]       = useState<Tab>(initialTab);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);

  function handleSubmitClick() { setSubmitModalOpen(true); }

  function handleNeedSignup() {
    setSubmitModalOpen(false);
    setWalletModalOpen(true);
  }

  function handleJoined() {
    setSubmitModalOpen(true);
  }

  function handleSubmitted() {
    setActiveTab('new');
    void queryClient.invalidateQueries({ queryKey: ['posts'] });
  }

  return (
    <>
      <Header onOpenSubmit={handleSubmitClick} />

      <nav>
        <TabBar activeTab={activeTab} onChange={setActiveTab} />
      </nav>

      <main className="mx-auto flex max-w-[680px] flex-col gap-4 px-4 py-5">
        <StatsBar />
        <PostFeed activeTab={activeTab} onNeedSignup={handleNeedSignup} />
      </main>

      <SiteFooter />

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

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}

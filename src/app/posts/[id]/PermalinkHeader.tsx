'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';

export function PermalinkHeader() {
  const router = useRouter();
  return <Header onOpenSubmit={() => router.push('/')} />;
}

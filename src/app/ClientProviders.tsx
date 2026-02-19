'use client';

/**
 * ClientProviders — thin wrapper that lazy-loads the wallet providers client-side only.
 *
 * WHY THIS EXISTS:
 * @walletconnect/ethereum-provider calls localStorage.getItem at module init time.
 * In Next.js 15, 'use client' components still get server-side rendered (SSR/prerender),
 * so importing wagmiConfig in providers.tsx triggers WalletConnect during the build,
 * crashing with: TypeError: localStorage.getItem is not a function
 *
 * FIX: dynamic(() => import('./providers'), { ssr: false }) inside a client component
 * prevents the import — and therefore WalletConnect initialization — from running server-side.
 * The wallet UI is only available after React hydrates on the client, which is fine
 * because wallet connection is inherently a client-side operation.
 *
 * NOTE: layout.tsx imports this instead of './providers' directly.
 */

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

// Map the named export to a default export so dynamic() types resolve correctly.
const Providers = dynamic(
  () => import('./providers').then(m => ({ default: m.Providers })),
  { ssr: false, loading: () => null },
);

export function ClientProviders({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>;
}

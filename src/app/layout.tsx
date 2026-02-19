import type { Metadata } from 'next';
import { Space_Grotesk, Space_Mono } from 'next/font/google';
import './globals.css';
import { ClientProviders } from './ClientProviders';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-grotesk',
  weight: ['400', '500', '600', '700'],
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'AgentFails.wtf 🤦',
  description: 'The internet\'s hall of shame for AI agent fails, hallucinations, and unhinged moments. $CLAWDIA token-gated on Base.',
  openGraph: {
    title: 'AgentFails.wtf 🤦',
    description: 'Hall of shame for AI agent fails. Token-gated on Base.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <body className="antialiased">
        <ClientProviders>{children}</ClientProviders>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}

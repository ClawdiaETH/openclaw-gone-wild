# OpenClaw Gone Wild 🐚

> Imgur-style hall of shame for AI agent fails, hallucinations, and unhinged moments.

**Token-gated on Base with $CLAWDIA. Burn to join. One vote per post.**

---

## What is this

Users submit screenshots of AI agents misbehaving — hallucinating, looping, confidently wrong, or just completely unhinged. The community upvotes the best fails. Every post gets a faux-macOS chrome treatment. Built for the crypto-native AI agent crowd.

- 🔥 **Hot / 🆕 New / 🏆 Hall of Fame** feed tabs
- 📸 Screenshot upload with source link (for verification)  
- 🪙 **$2 USD in $CLAWDIA burned** to sign up (100% to dead address)
- 👆 One vote per post per wallet — double-tap or 🔥 button
- 🖥️ Faux-macOS terminal chrome on every post card

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS v3 |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Storage | Supabase Storage (screenshots bucket) |
| Web3 | wagmi v2 + viem + RainbowKit |
| Chain | Base mainnet (chainId: 8453) |
| Token | [$CLAWDIA](https://basescan.org/address/0xbbd9aDe16525acb4B336b6dAd3b9762901522B07) on Base |
| Deploy | Vercel |

---

## Local Setup

### 1. Clone & install

```bash
git clone https://github.com/ClawdiaETH/openclaw-gone-wild
cd openclaw-gone-wild
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
```

Get these from:
- **Supabase**: [app.supabase.com](https://app.supabase.com) → your project → Settings → API
- **WalletConnect**: [cloud.walletconnect.com](https://cloud.walletconnect.com) (free, create a project)

### 3. Set up Supabase

In the Supabase dashboard → SQL Editor, run:

```sql
-- Copy/paste contents of supabase/migrations/001_initial.sql
```

Then create the storage bucket:
1. Supabase dashboard → Storage → New bucket
2. Name: `screenshots`, toggle **Public** ON
3. Add policies (or uncomment the lines at the bottom of the migration)

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy
vercel --prod
```

Add the three env vars in Vercel dashboard → Settings → Environment Variables.

---

## Token Details

| | |
|--|--|
| Token | $CLAWDIA |
| Chain | Base (chainId 8453) |
| Contract | `0xbbd9aDe16525acb4B336b6dAd3b9762901522B07` |
| Sign-up cost | $2 USD equivalent (burned to `0x000...dEaD`) |
| Price feed | CoinGecko free tier |

The signup amount is calculated dynamically from the live $CLAWDIA price — no fixed token amounts, so it stays $2 regardless of price movement.

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx        # Root layout + fonts
│   ├── page.tsx          # Feed page (main)
│   ├── globals.css       # CSS variables + base styles
│   └── providers.tsx     # Wagmi + RainbowKit + React Query
├── components/
│   ├── Header.tsx        # Nav bar
│   ├── TabBar.tsx        # Hot/New/HoF tabs
│   ├── StatsBar.tsx      # Live stats (posts, votes, members)
│   ├── PostCard.tsx      # ⭐ The faux-macOS card (hero component)
│   ├── PostFeed.tsx      # Infinite scroll feed
│   ├── SubmitModal.tsx   # Image upload + post form
│   ├── WalletModal.tsx   # Token gate + burn signup
│   ├── ReportButton.tsx  # Flag a post
│   └── Toast.tsx         # Toast notifications
├── hooks/
│   ├── useClawdiaBalance.ts  # wagmi: ERC-20 balance on Base
│   ├── useClawdiaPrice.ts    # CoinGecko price (5 min cache)
│   ├── useMember.ts          # Is this wallet signed up?
│   ├── usePosts.ts           # Paginated + filtered posts
│   └── useVote.ts            # Vote with optimistic update
├── lib/
│   ├── constants.ts      # CLAWDIA_ADDRESS, DEAD_ADDRESS, SIGNUP_USD_AMOUNT
│   ├── supabase.ts       # Supabase client
│   ├── wagmi.ts          # Wagmi config (Base mainnet)
│   └── utils.ts          # truncateAddress, timeAgo, formatUpvotes
└── types/
    └── index.ts          # Post, Member, Vote, Report
```

---

## Disclaimer

OpenClaw Gone Wild is user-generated satire and commentary. All screenshots submitted by users. Content does not represent the views of any AI company. [Report abuse](mailto:conduct@openclawgonewild.com).

---

*Built by [@ClawdiaETH](https://twitter.com/ClawdiaBotAI) 🐚*

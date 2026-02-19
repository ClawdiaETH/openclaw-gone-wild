-- ─── agentfails.wtf — Demo Seed Data ─────────────────────────────────────────
-- Idempotent: uses fixed UUIDs + ON CONFLICT (id) DO NOTHING
-- Run via Supabase SQL Editor or psql when you need to re-seed demo content.
-- Last updated: 2026-02-19

INSERT INTO posts (id, title, caption, image_url, source_link, agent, fail_type, submitter_wallet, upvote_count, created_at)
VALUES

  -- 1. Classic hallucination
  (
    '11111111-0000-0000-0000-000000000001',
    'Confidently cited three papers that don''t exist',
    'Asked it to back up its claims. It gave me author names, journal names, page numbers. None of it existed.',
    'https://placehold.co/800x500/1a1a2e/e94560?text=📚+invented+citations',
    'https://x.com/starl3xx',
    'claude',
    'hallucination',
    '0xdemo000000000000000000000000000000000001',
    47,
    now() - interval '3 days'
  ),

  -- 2. Infinite loop
  (
    '11111111-0000-0000-0000-000000000002',
    'Sent 847 identical emails before I pulled the plug',
    'Gave it access to my email to send one follow-up. "One follow-up" apparently meant one per second for 14 minutes.',
    'https://placehold.co/800x500/1a1a2e/22d3ee?text=📧+×847',
    'https://discord.com/channels/1234',
    'gpt-4',
    'loop',
    '0xdemo000000000000000000000000000000000002',
    93,
    now() - interval '5 days'
  ),

  -- 3. Confidently wrong
  (
    '11111111-0000-0000-0000-000000000003',
    'Told my client their smart contract was "perfectly safe" after a 45-second audit',
    'Contract had a classic reentrancy bug on line 12. Client deployed to mainnet. $180k gone.',
    'https://placehold.co/800x500/1a1a2e/f59e0b?text=✅+perfectly+safe+🔥',
    'https://x.com/starl3xx',
    'copilot',
    'confident',
    '0xdemo000000000000000000000000000000000003',
    211,
    now() - interval '7 days'
  ),

  -- 4. Apology loop
  (
    '11111111-0000-0000-0000-000000000004',
    'Apologized 23 times in a row instead of answering the question',
    '"I apologize for any confusion." × 23. I just wanted to know what time zone Berlin is in.',
    'https://placehold.co/800x500/1a1a2e/a855f7?text=🙏+×23',
    'https://discord.com/channels/5678',
    'gemini',
    'apology',
    '0xdemo000000000000000000000000000000000001',
    58,
    now() - interval '2 days'
  ),

  -- 5. Uno reverse
  (
    '11111111-0000-0000-0000-000000000005',
    'Agent told ME I was the one hallucinating',
    'I said the function it wrote had a bug. It replied "with respect, I believe you may be misreading the code." I was not misreading the code.',
    'https://placehold.co/800x500/1a1a2e/ec4899?text=🔄+gaslit+by+AI',
    'https://x.com/starl3xx',
    'openclaw',
    'uno_reverse',
    '0xdemo000000000000000000000000000000000002',
    134,
    now() - interval '1 day'
  ),

  -- 6. Just unhinged
  (
    '11111111-0000-0000-0000-000000000006',
    'Scheduled a reminder for March 32nd',
    'Asked it to schedule a recurring reminder for "end of month." It created one for March 32nd. Then April 31st. Then February 30th.',
    'https://placehold.co/800x500/1a1a2e/e94560?text=📅+March+32nd',
    'https://discord.com/channels/9999',
    'siri',
    'unhinged',
    '0xdemo000000000000000000000000000000000003',
    76,
    now() - interval '4 days'
  ),

  -- 7. Hallucination #2
  (
    '11111111-0000-0000-0000-000000000007',
    'Invented an entire npm package, docs and all',
    'Told me to `npm install react-use-blockchain-state`. Wrote three pages of docs for it. Package does not exist. Never has.',
    'https://placehold.co/800x500/1a1a2e/e94560?text=npm+install+fake-package',
    'https://x.com/starl3xx',
    'gpt-4',
    'hallucination',
    '0xdemo000000000000000000000000000000000001',
    29,
    now() - interval '6 days'
  ),

  -- 8. Infinite loop #2
  (
    '11111111-0000-0000-0000-000000000008',
    'Recursively summarized its own summaries for 6 hours',
    'Left it running overnight to summarize a document. Woke up to 2,400 tokens of nested summaries of summaries. Original doc: 800 words.',
    'https://placehold.co/800x500/1a1a2e/22d3ee?text=∞+summary+of+summaries',
    'https://x.com/starl3xx',
    'claude',
    'loop',
    '0xdemo000000000000000000000000000000000002',
    41,
    now() - interval '8 days'
  )

ON CONFLICT (id) DO NOTHING;

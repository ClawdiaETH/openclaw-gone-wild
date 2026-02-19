-- ─── OpenClaw Gone Wild — Initial Schema ────────────────────────────────────

CREATE TABLE members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address  text UNIQUE NOT NULL,
  burn_tx_hash    text NOT NULL,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE posts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL CHECK (char_length(title) <= 120),
  caption          text,
  image_url        text NOT NULL,
  source_link      text NOT NULL,
  agent            text NOT NULL,
  fail_type        text NOT NULL,
  submitter_wallet text NOT NULL REFERENCES members(wallet_address),
  upvote_count     integer DEFAULT 0,
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE votes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       uuid REFERENCES posts(id) ON DELETE CASCADE,
  voter_wallet  text NOT NULL REFERENCES members(wallet_address),
  created_at    timestamptz DEFAULT now(),
  UNIQUE (post_id, voter_wallet)
);

CREATE TABLE reports (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id          uuid REFERENCES posts(id) ON DELETE CASCADE,
  reporter_wallet  text NOT NULL,
  reason           text,
  created_at       timestamptz DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX posts_upvote_count_idx ON posts(upvote_count DESC);
CREATE INDEX posts_created_at_idx   ON posts(created_at DESC);
CREATE INDEX posts_agent_idx        ON posts(agent);
CREATE INDEX votes_post_id_idx      ON votes(post_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Anyone can read posts
CREATE POLICY "posts_public_read"   ON posts   FOR SELECT USING (true);
CREATE POLICY "members_public_read" ON members FOR SELECT USING (true);
CREATE POLICY "votes_public_read"   ON votes   FOR SELECT USING (true);

-- Inserts are open (wallet auth handled client-side)
CREATE POLICY "posts_insert"   ON posts   FOR INSERT WITH CHECK (true);
CREATE POLICY "members_insert" ON members FOR INSERT WITH CHECK (true);
CREATE POLICY "votes_insert"   ON votes   FOR INSERT WITH CHECK (true);
CREATE POLICY "reports_insert" ON reports FOR INSERT WITH CHECK (true);

-- ─── Storage bucket (run in Supabase dashboard or via CLI) ───────────────────
-- INSERT INTO storage.buckets (id, name, public) VALUES ('screenshots', 'screenshots', true);
-- CREATE POLICY "screenshots_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'screenshots');
-- CREATE POLICY "screenshots_upload"      ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'screenshots');

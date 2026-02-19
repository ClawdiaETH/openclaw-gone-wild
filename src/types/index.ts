export interface Member {
  id: string;
  wallet_address: string;
  /** USDC transfer tx hash (replaces legacy burn_tx_hash) */
  payment_tx_hash:  string;
  payment_amount:   string; // "2.00"
  payment_currency: string; // "USDC"
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  caption?: string;
  image_url: string;
  source_link: string;
  agent: string;
  fail_type: string;
  submitter_wallet: string;
  upvote_count: number;
  created_at: string;
}

export interface Vote {
  id: string;
  post_id: string;
  voter_wallet: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  content: string;
  author_wallet?: string | null;
  author_name?: string | null;
  payment_tx_hash?: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  post_id: string;
  reporter_wallet: string;
  reason?: string;
  created_at: string;
}

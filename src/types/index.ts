export interface Member {
  id: string;
  wallet_address: string;
  burn_tx_hash: string;
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

export interface Report {
  id: string;
  post_id: string;
  reporter_wallet: string;
  reason?: string;
  created_at: string;
}

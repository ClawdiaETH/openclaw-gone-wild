-- agentfails.wtf — Add payment_tx_hash to comments table
-- Run in Supabase SQL Editor (Settings → SQL Editor → New Query)
-- Date: 2026-02-19

ALTER TABLE comments ADD COLUMN IF NOT EXISTS payment_tx_hash text;

CREATE UNIQUE INDEX IF NOT EXISTS comments_payment_tx_hash_idx
  ON comments(payment_tx_hash)
  WHERE payment_tx_hash IS NOT NULL;

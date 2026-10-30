-- Federal Union Bank – full schema migration
-- Run once: psql $DATABASE_URL -f drizzle/0000_init.sql
-- Or paste into your DB provider's SQL editor (Neon / Supabase).

-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Enums ────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE trade_side       AS ENUM ('buy', 'sell');       EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE trade_status     AS ENUM ('completed', 'failed', 'pending'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE transfer_status  AS ENUM ('completed', 'failed', 'pending'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Auth tables (better-auth) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  is_admin        BOOLEAN NOT NULL DEFAULT FALSE,
  image           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accounts (
  id                        TEXT PRIMARY KEY,
  user_id                   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id                TEXT NOT NULL,
  provider_id               TEXT NOT NULL,
  access_token              TEXT,
  refresh_token             TEXT,
  access_token_expires_at   TIMESTAMPTZ,
  refresh_token_expires_at  TIMESTAMPTZ,
  scope                     TEXT,
  id_token                  TEXT,
  password                  TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verifications (
  id          TEXT PRIMARY KEY,
  identifier  TEXT NOT NULL,
  value       TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── User profiles ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id       TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  account_id    TEXT NOT NULL UNIQUE,   -- 10-digit numeric account number
  pin_hash      TEXT,                   -- bcrypt hash of 4-digit transaction PIN
  phone         TEXT,
  avatar_url    TEXT,
  referral_code TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Email OTPs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_otps (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  otp        TEXT NOT NULL,          -- 6-digit code stored as bcrypt hash
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── App tables ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_balances (
  user_id       TEXT PRIMARY KEY,
  usdc_balance  NUMERIC(20,6) NOT NULL DEFAULT 0,
  usd_balance   NUMERIC(20,2) NOT NULL DEFAULT 10000.00,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usdc_trades (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL,
  side         trade_side NOT NULL,
  usdc_amount  NUMERIC(20,6) NOT NULL,
  usd_amount   NUMERIC(20,2) NOT NULL,
  price        NUMERIC(10,6) NOT NULL,
  status       trade_status NOT NULL DEFAULT 'completed',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usdc_transfers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL,
  recipient    TEXT NOT NULL,
  usdc_amount  NUMERIC(20,6) NOT NULL,
  note         TEXT NOT NULL DEFAULT '',
  status       transfer_status NOT NULL DEFAULT 'completed',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usd_transfers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL,
  recipient    TEXT NOT NULL,
  usd_amount    NUMERIC(20,2) NOT NULL,
  note         TEXT NOT NULL DEFAULT '',
  status       transfer_status NOT NULL DEFAULT 'completed',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Virtual cards ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS virtual_cards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL UNIQUE,
  card_number  TEXT NOT NULL,
  expiry       TEXT NOT NULL,
  cvv          TEXT NOT NULL,
  card_name    TEXT NOT NULL,
  frozen       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Savings ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS savings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  usd_balance   NUMERIC(20,2) NOT NULL DEFAULT 0,
  interest_rate NUMERIC(5,4)  NOT NULL DEFAULT 0.0500,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_trades_user_id    ON usdc_trades(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transfers_user_id ON usdc_transfers(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_token    ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_email_otps_email  ON email_otps(email, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_acct_id  ON user_profiles(account_id);

-- ── Seed admin account ─────────────────────────────────────────────────────
-- The admin can fund and view all user accounts.
-- Login at /login with these credentials after running the setup script:
--   Email: admin@federalunion.com
--   Password: Admin@12345
--
-- To create the admin password hash, run: node scripts/create-admin.mjs
-- Then paste the hash into the INSERT below.
INSERT INTO users (id, name, email, email_verified, is_admin)
VALUES ('admin-0000-0000-0000-0000-0000-admin', 'Bank Admin', 'admin@federalunion.com', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- The password hash will be set by the create-admin script.
-- Until then, the admin account exists but has no password (can't log in).

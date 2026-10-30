/**
 * Runs lightweight schema migrations on startup.
 * Called once from auth.ts so it runs on the first request to any auth route.
 * Safe to run multiple times — all statements are idempotent.
 */
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

let migrated = false

export async function runMigrations() {
  if (migrated) return
  migrated = true

  try {
    // Add is_admin column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE
    `)

    // Add usd_transfers table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS usd_transfers (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id      TEXT NOT NULL,
        recipient    TEXT NOT NULL,
        usd_amount   NUMERIC(20,2) NOT NULL,
        note         TEXT NOT NULL DEFAULT '',
        status       TEXT NOT NULL DEFAULT 'completed',
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)

    // Add user_profiles table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id       TEXT PRIMARY KEY,
        account_id    TEXT NOT NULL UNIQUE,
        pin_hash      TEXT,
        phone         TEXT,
        avatar_url    TEXT,
        referral_code TEXT NOT NULL DEFAULT '',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)

    // Add savings table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS savings (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id       TEXT NOT NULL UNIQUE,
        usd_balance   NUMERIC(20,2) NOT NULL DEFAULT 0,
        interest_rate NUMERIC(5,4)  NOT NULL DEFAULT 0.0500,
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)

    // Add virtual_cards table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS virtual_cards (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     TEXT NOT NULL UNIQUE,
        card_number TEXT NOT NULL,
        expiry      TEXT NOT NULL,
        cvv         TEXT NOT NULL,
        card_name   TEXT NOT NULL,
        frozen      BOOLEAN NOT NULL DEFAULT FALSE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)

    // Add email_otps table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS email_otps (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email      TEXT NOT NULL,
        otp        TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used       BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)

    // Ensure the admin account has is_admin = true
    const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@federalunion.com'
    await db.execute(sql`
      UPDATE users SET is_admin = TRUE WHERE email = ${adminEmail}
    `)

    console.log('[migrate] Schema migrations applied.')
  } catch (err) {
    console.error('[migrate] Migration error (non-fatal):', err)
  }
}

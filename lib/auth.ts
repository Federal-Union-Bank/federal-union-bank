import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import * as schema from '@/lib/schema'
import { runMigrations } from '@/lib/migrate'

// Run schema migrations on first auth request (idempotent)
runMigrations()

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user:         schema.users,
      session:      schema.sessions,
      account:      schema.accounts,
      verification: schema.verifications,
    },
  }),

  emailAndPassword: {
    enabled: true,
    // requireEmailVerification blocks login until email is verified
    requireEmailVerification: true,

    // After sign-up: seed balance + profile (email verify happens separately via OTP flow)
    onSignUp: async ({ user }) => {
      // Generate a 10-digit numeric account ID
      const accountId = String(Math.floor(1_000_000_000 + Math.random() * 9_000_000_000))
      const referralCode = user.id.slice(0, 8).toUpperCase()

      await db.execute(sql`
        INSERT INTO user_balances (user_id)
        VALUES (${user.id})
        ON CONFLICT (user_id) DO NOTHING
      `)

      await db.execute(sql`
        INSERT INTO user_profiles (user_id, account_id, referral_code)
        VALUES (${user.id}, ${accountId}, ${referralCode})
        ON CONFLICT (user_id) DO NOTHING
      `)

      await db.execute(sql`
        INSERT INTO savings (user_id) VALUES (${user.id})
        ON CONFLICT (user_id) DO NOTHING
      `)
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,  // 7 days
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },

  secret:  process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
})

export type Session = typeof auth.$Infer.Session
export type User    = typeof auth.$Infer.Session.user

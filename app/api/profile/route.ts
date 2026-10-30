import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getUserId } from '@/lib/session'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const userId = await getUserId(request)

    // Check admin — try is_admin column first, fall back to email check
    let isAdmin = false
    try {
      const adminResult = await db.execute(
        sql`SELECT is_admin FROM users WHERE id = ${userId}`,
      )
      isAdmin = (adminResult.rows[0] as { is_admin: boolean } | undefined)?.is_admin ?? false
    } catch {
      // is_admin column might not exist yet — fall back to email
      try {
        const emailResult = await db.execute(
          sql`SELECT email FROM users WHERE id = ${userId}`,
        )
        const email = (emailResult.rows[0] as { email: string } | undefined)?.email ?? ''
        isAdmin = email === (process.env.ADMIN_EMAIL ?? 'admin@federalunion.com')
      } catch {}
    }

    // Then try to get profile data (might not exist for admin)
    const result = await db.execute(sql`
      SELECT account_id, pin_hash, referral_code, phone, avatar_url
      FROM user_profiles
      WHERE user_id = ${userId}
    `)

    const row = result.rows[0] as
      | { account_id: string; pin_hash: string | null; referral_code: string; phone: string | null; avatar_url: string | null }
      | undefined

    if (!row) {
      // Auto-create a profile if missing
      const accountId = String(Math.floor(1_000_000_000 + Math.random() * 9_000_000_000))
      const referralCode = userId.slice(0, 8).toUpperCase()

      try {
        await db.execute(sql`
          INSERT INTO user_profiles (user_id, account_id, referral_code)
          VALUES (${userId}, ${accountId}, ${referralCode})
          ON CONFLICT (user_id) DO NOTHING
        `)
      } catch {
        // Table might not exist — return with generated values anyway
      }

      return NextResponse.json({
        accountId,
        pinSet:       false,
        referralCode,
        phone:        null,
        avatarUrl:    null,
        isAdmin,
      })
    }

    return NextResponse.json({
      accountId:    row.account_id,
      pinSet:       !!row.pin_hash,
      referralCode: row.referral_code,
      phone:        row.phone,
      avatarUrl:    row.avatar_url,
      isAdmin,
    })
  } catch (err) {
    console.error('[profile] error:', err)

    // Even on error, try to return isAdmin so the admin button shows
    try {
      const uid = await getUserId(request)
      const adminResult = await db.execute(sql`SELECT is_admin FROM users WHERE id = ${uid}`)
      const isAdmin = (adminResult.rows[0] as { is_admin: boolean } | undefined)?.is_admin ?? false

      return NextResponse.json({
        accountId:    '',
        pinSet:       false,
        referralCode: '',
        phone:        null,
        avatarUrl:    null,
        isAdmin,
      })
    } catch {
      return NextResponse.json({
        accountId:    '',
        pinSet:       false,
        referralCode: '',
        phone:        null,
        avatarUrl:    null,
        isAdmin:      false,
      })
    }
  }
}

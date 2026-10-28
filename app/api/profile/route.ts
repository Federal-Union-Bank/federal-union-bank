import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getUserId } from '@/lib/session'

export async function GET(request: Request) {
  try {
    const userId = await getUserId(request)

    const result = await db.execute(sql`
      SELECT p.account_id, p.pin_hash, p.referral_code, p.phone, p.avatar_url,
             u.is_admin
      FROM user_profiles p
      JOIN users u ON u.id = p.user_id
      WHERE p.user_id = ${userId}
    `)

    const row = result.rows[0] as
      | { account_id: string; pin_hash: string | null; referral_code: string; phone: string | null; avatar_url: string | null; is_admin: boolean }
      | undefined

    if (!row) {
      // Auto-create a profile if missing
      const accountId = String(Math.floor(1_000_000_000 + Math.random() * 9_000_000_000))
      const referralCode = userId.slice(0, 8).toUpperCase()

      await db.execute(sql`
        INSERT INTO user_profiles (user_id, account_id, referral_code)
        VALUES (${userId}, ${accountId}, ${referralCode})
        ON CONFLICT (user_id) DO NOTHING
      `)

      // Check admin flag
      const adminResult = await db.execute(sql`SELECT is_admin FROM users WHERE id = ${userId}`)
      const isAdmin = (adminResult.rows[0] as { is_admin: boolean } | undefined)?.is_admin ?? false

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
      isAdmin:      !!row.is_admin,
    })
  } catch (err) {
    console.error('[profile] error:', err)
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

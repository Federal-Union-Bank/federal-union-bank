import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/admin'

export const runtime = 'nodejs'

// GET — list all users with their balances and account IDs
export async function GET(request: Request) {
  const admin = await getAdminUser(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const result = await db.execute(sql`
    SELECT
      u.id,
      u.name,
      u.email,
      u.is_admin,
      u.created_at,
      COALESCE(p.account_id, '')   AS account_id,
      COALESCE(b.usd_balance, 0)    AS usd_balance,
      COALESCE(b.usdc_balance, 0)   AS usdc_balance,
      COALESCE(s.usd_balance, 0)    AS savings_balance
    FROM users u
    LEFT JOIN user_balances b  ON b.user_id = u.id
    LEFT JOIN user_profiles p  ON p.user_id = u.id
    LEFT JOIN savings s        ON s.user_id = u.id
    ORDER BY u.created_at DESC
  `)

  return NextResponse.json({ users: result.rows })
}

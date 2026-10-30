import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/admin'

export const runtime = 'nodejs'

// GET — admin overview stats
export async function GET(request: Request) {
  const admin = await getAdminUser(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const userCount = await db.execute(sql`
    SELECT count(*) AS total, 
           count(*) FILTER (WHERE is_admin = FALSE) AS regular,
           count(*) FILTER (WHERE is_admin = TRUE) AS admins
    FROM users
  `)

  const totalBalances = await db.execute(sql`
    SELECT
      COALESCE(SUM(usd_balance), 0)  AS total_usd,
      COALESCE(SUM(usdc_balance), 0) AS total_usdc,
      COUNT(DISTINCT user_id)        AS accounts_with_balance
    FROM user_balances
  `)

  const totalSavings = await db.execute(sql`
    SELECT COALESCE(SUM(usd_balance), 0) AS total_savings
    FROM savings
  `)

  const recentTransactions = await db.execute(sql`
    (SELECT 'trade' AS type, user_id, usd_amount AS amount, created_at
     FROM usdc_trades ORDER BY created_at DESC LIMIT 10)
    UNION ALL
    (SELECT 'usd_transfer' AS type, user_id, usd_amount AS amount, created_at
     FROM usd_transfers ORDER BY created_at DESC LIMIT 10)
    ORDER BY created_at DESC
    LIMIT 10
  `)

  return NextResponse.json({
    users:              userCount.rows[0],
    balances:           totalBalances.rows[0],
    savings:            totalSavings.rows[0],
    recentTransactions: recentTransactions.rows,
  })
}

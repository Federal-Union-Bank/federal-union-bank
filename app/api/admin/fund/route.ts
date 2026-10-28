import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/admin'

// POST — admin funds a user's USD balance
export async function POST(request: Request) {
  const admin = await getAdminUser(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { userId, amount } = await request.json()
  const amt = Number(amount)

  if (!userId || !Number.isFinite(amt) || amt <= 0) {
    return NextResponse.json({ error: 'Provide a valid user ID and amount.' }, { status: 400 })
  }

  // Credit the user's USD balance
  const result = await db.execute(sql`
    UPDATE user_balances
    SET usd_balance = usd_balance + ${amt},
        updated_at  = now()
    WHERE user_id = ${userId}
    RETURNING usd_balance
  `)

  if (!result.rows.length) {
    // Balance row doesn't exist — create it
    await db.execute(sql`
      INSERT INTO user_balances (user_id, usd_balance)
      VALUES (${userId}, ${amt})
      ON CONFLICT DO NOTHING
    `)
    return NextResponse.json({ funded: amt, newBalance: String(amt) })
  }

  return NextResponse.json({
    funded:     amt,
    newBalance: result.rows[0].usd_balance,
  })
}

import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/admin'

export const runtime = 'nodejs'

// Only the admin can deposit funds into any account
export async function POST(request: Request) {
  const admin = await getAdminUser(request)
  if (!admin) {
    return NextResponse.json(
      { error: 'Only an admin can deposit funds into accounts.' },
      { status: 403 },
    )
  }

  const body   = await request.json()
  // Admin can specify a target userId, or defaults to their own
  const targetUserId = String(body.userId || admin.id)
  const amount = Number(body.amount)

  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) {
    return NextResponse.json({ error: 'Enter a valid amount.' }, { status: 400 })
  }

  const result = await db.execute(
    sql`UPDATE user_balances
        SET usd_balance = usd_balance + ${amount},
            updated_at  = now()
        WHERE user_id = ${targetUserId}
        RETURNING usd_balance`,
  )

  if (!result.rows.length) {
    await db.execute(sql`
      INSERT INTO user_balances (user_id, usd_balance)
      VALUES (${targetUserId}, ${amount})
      ON CONFLICT (user_id) DO UPDATE
      SET usd_balance = user_balances.usd_balance + ${amount}
    `)
    return NextResponse.json({ balance: String(amount) })
  }

  return NextResponse.json({ balance: result.rows[0].usd_balance })
}

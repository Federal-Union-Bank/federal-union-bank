import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getUserId } from '@/lib/session'

// Deposit USD into your account (demo — adds to balance)
export async function POST(request: Request) {
  const id = await getUserId(request)
  const body = await request.json()
  const amount = Number(body.amount)

  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
    return NextResponse.json({ error: 'Enter a valid amount.' }, { status: 400 })
  }

  // In a real app this would integrate with a payment processor.
  // For the demo, we just credit the account.
  const result = await db.execute(
    sql`UPDATE user_balances
        SET usd_balance = usd_balance + ${amount},
            updated_at  = now()
        WHERE user_id = ${id}
        RETURNING usd_balance`,
  )

  if (!result.rows.length) {
    // Create balance row if missing
    await db.execute(sql`
      INSERT INTO user_balances (user_id, usd_balance)
      VALUES (${id}, ${amount})
      ON CONFLICT (user_id) DO UPDATE
      SET usd_balance = user_balances.usd_balance + ${amount}
    `)
    return NextResponse.json({ balance: String(amount) })
  }

  return NextResponse.json({ balance: result.rows[0].usd_balance })
}

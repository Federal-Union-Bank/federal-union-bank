import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getUserId } from '@/lib/session'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const id = await getUserId(request)
  const body = await request.json()
  const amount = Number(body.amount)

  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
    return NextResponse.json({ error: 'Enter a valid funding amount.' }, { status: 400 })
  }

  const rounded = Number(amount.toFixed(2))

  const result = await db.execute(
    sql`UPDATE user_balances
        SET usd_balance   = usd_balance  - ${rounded},
            usdc_balance  = usdc_balance + ${rounded},
            updated_at    = now()
        WHERE user_id = ${id}
          AND usd_balance >= ${rounded}
        RETURNING usd_balance, usdc_balance`,
  )

  if (!result.rows.length) {
    return NextResponse.json(
      { error: 'Insufficient USD balance in your main account.' },
      { status: 400 },
    )
  }

  return NextResponse.json({ funding: result.rows[0], amount: rounded })
}

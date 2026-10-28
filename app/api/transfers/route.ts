import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getUserId } from '@/lib/session'

export async function POST(request: Request) {
  const id = await getUserId(request)
  const body = await request.json()
  const recipient = String(body.recipient || '').trim()
  const amount = Number(body.amount)
  const note = String(body.note || '').trim().slice(0, 140)

  if (!recipient || !Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
    return NextResponse.json(
      { error: 'Enter a recipient and valid USDC amount.' },
      { status: 400 },
    )
  }

  const result = await db.execute(
    sql`WITH updated AS (
          UPDATE user_balances
          SET usdc_balance = usdc_balance - ${amount},
              updated_at   = now()
          WHERE user_id = ${id}
            AND usdc_balance >= ${amount}
          RETURNING usdc_balance
        )
        INSERT INTO usdc_transfers (user_id, recipient, usdc_amount, note)
        SELECT ${id}, ${recipient}, ${amount}, ${note}
        FROM updated
        RETURNING id, recipient, usdc_amount, note, status, created_at`,
  )

  if (!result.rows.length) {
    return NextResponse.json({ error: 'Insufficient USDC balance.' }, { status: 400 })
  }

  return NextResponse.json({ transfer: result.rows[0] })
}

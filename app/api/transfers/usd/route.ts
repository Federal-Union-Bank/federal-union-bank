import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getUserId } from '@/lib/session'

// GET recent USD transfers
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const id = await getUserId(request)
  const result = await db.execute(
    sql`SELECT id, recipient, usd_amount, note, status, created_at
        FROM usd_transfers
        WHERE user_id = ${id}
        ORDER BY created_at DESC
        LIMIT 20`,
  )
  return NextResponse.json(result.rows)
}

// Send USD to another account
export async function POST(request: Request) {
  const id = await getUserId(request)
  const body = await request.json()
  const recipient = String(body.recipient || '').trim()
  const amount = Number(body.amount)
  const note = String(body.note || '').trim().slice(0, 140)

  if (!recipient || !Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
    return NextResponse.json(
      { error: 'Enter a recipient and valid amount.' },
      { status: 400 },
    )
  }

  const result = await db.execute(
    sql`WITH updated AS (
          UPDATE user_balances
          SET usd_balance = usd_balance - ${amount},
              updated_at  = now()
          WHERE user_id = ${id}
            AND usd_balance >= ${amount}
          RETURNING usd_balance
        )
        INSERT INTO usd_transfers (user_id, recipient, usd_amount, note)
        SELECT ${id}, ${recipient}, ${amount}, ${note}
        FROM updated
        RETURNING id, recipient, usd_amount, note, status, created_at`,
  )

  if (!result.rows.length) {
    return NextResponse.json({ error: 'Insufficient USD balance.' }, { status: 400 })
  }

  return NextResponse.json({ transfer: result.rows[0] })
}

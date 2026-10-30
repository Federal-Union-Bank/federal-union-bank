import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getUserId } from '@/lib/session'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const userId = await getUserId(request)

    const result = await db.execute(sql`
      SELECT usd_balance, interest_rate
      FROM savings
      WHERE user_id = ${userId}
    `)

    const row = result.rows[0] as { usd_balance: string; interest_rate: string } | undefined

    if (!row) {
      await db.execute(sql`INSERT INTO savings (user_id) VALUES (${userId}) ON CONFLICT DO NOTHING`)
      return NextResponse.json({ balance: '0', rate: '0.0500' })
    }

    return NextResponse.json({ balance: row.usd_balance, rate: row.interest_rate })
  } catch (err) {
    console.error('[savings] error:', err)
    return NextResponse.json({ balance: '0', rate: '0.0500' })
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId(request)
    const { action, amount } = await request.json()

    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) {
      return NextResponse.json({ error: 'Enter a valid amount.' }, { status: 400 })
    }

    if (action === 'deposit') {
      const result = await db.execute(sql`
        WITH moved AS (
          UPDATE user_balances
          SET usd_balance = usd_balance - ${amt}, updated_at = now()
          WHERE user_id = ${userId} AND usd_balance >= ${amt}
          RETURNING user_id
        )
        UPDATE savings
        SET usd_balance = usd_balance + ${amt}, updated_at = now()
        WHERE user_id = (SELECT user_id FROM moved)
        RETURNING usd_balance
      `)
      if (!result.rows.length) {
        return NextResponse.json({ error: 'Insufficient USD balance.' }, { status: 400 })
      }
      return NextResponse.json({ balance: result.rows[0].usd_balance })
    }

    if (action === 'withdraw') {
      const result = await db.execute(sql`
        WITH moved AS (
          UPDATE savings
          SET usd_balance = usd_balance - ${amt}, updated_at = now()
          WHERE user_id = ${userId} AND usd_balance >= ${amt}
          RETURNING user_id
        )
        UPDATE user_balances
        SET usd_balance = usd_balance + ${amt}, updated_at = now()
        WHERE user_id = (SELECT user_id FROM moved)
        RETURNING user_id
      `)
      if (!result.rows.length) {
        return NextResponse.json({ error: 'Insufficient savings balance.' }, { status: 400 })
      }
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
  } catch (err) {
    console.error('[savings POST] error:', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getUsdcPrice } from '@/lib/price'
import { getUserId } from '@/lib/session'

export async function GET(request: Request) {
  const id = await getUserId(request)
  const price = await getUsdcPrice()

  const balanceResult = await db.execute(
    sql`INSERT INTO user_balances (user_id)
        VALUES (${id})
        ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
        RETURNING user_id, usdc_balance, usd_balance`,
  )
  const tradesResult = await db.execute(
    sql`SELECT id, side, usdc_amount, usd_amount, price, status, created_at
        FROM usdc_trades
        WHERE user_id = ${id}
        ORDER BY created_at DESC LIMIT 12`,
  )
  const transfersResult = await db.execute(
    sql`SELECT id, recipient, usdc_amount, note, status, created_at
        FROM usdc_transfers
        WHERE user_id = ${id}
        ORDER BY created_at DESC LIMIT 12`,
  )

  return NextResponse.json({
    balance:   balanceResult.rows,
    trades:    tradesResult.rows,
    transfers: transfersResult.rows,
    price,
  })
}

export async function POST(request: Request) {
  const id = await getUserId(request)
  const body = await request.json()
  const side = body.side === 'sell' ? 'sell' : 'buy'
  const amount = Number(body.amount)

  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
    return NextResponse.json({ error: 'Enter a valid USDC amount.' }, { status: 400 })
  }

  const price = await getUsdcPrice()
  const usdAmount = Number((amount * price).toFixed(2))

  const result = await db.execute(
    sql`WITH current_balance AS (
          SELECT usdc_balance, usd_balance
          FROM user_balances
          WHERE user_id = ${id}
          FOR UPDATE
        ),
        updated AS (
          UPDATE user_balances
          SET usdc_balance = usdc_balance ${side === 'buy' ? sql`+ ${amount}` : sql`- ${amount}`},
              usd_balance  = usd_balance  ${side === 'buy' ? sql`- ${usdAmount}` : sql`+ ${usdAmount}`},
              updated_at   = now()
          WHERE user_id = ${id}
            AND ${side === 'buy' ? sql`usd_balance >= ${usdAmount}` : sql`usdc_balance >= ${amount}`}
          RETURNING usdc_balance, usd_balance
        )
        INSERT INTO usdc_trades (user_id, side, usdc_amount, usd_amount, price)
        SELECT ${id}, ${side}, ${amount}, ${usdAmount}, ${price}
        FROM updated
        RETURNING id, side, usdc_amount, usd_amount, price, status, created_at`,
  )

  if (!result.rows.length) {
    return NextResponse.json({ error: 'Insufficient balance.' }, { status: 400 })
  }

  return NextResponse.json({ trade: result.rows[0], price })
}

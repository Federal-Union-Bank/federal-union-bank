import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getUserId } from '@/lib/session'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const userId = await getUserId(request)

  const trades = await db.execute(sql`
    SELECT id, 'trade' AS type, side, usdc_amount, usd_amount, price, status, created_at
    FROM usdc_trades
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 100
  `)

  const transfers = await db.execute(sql`
    SELECT id, 'transfer' AS type, recipient, usdc_amount, note, status, created_at
    FROM usdc_transfers
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 100
  `)

  const usdTransfers = await db.execute(sql`
    SELECT id, 'usd_transfer' AS type, recipient, usd_amount, note, status, created_at
    FROM usd_transfers
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 100
  `)

  // Merge and sort by date
  const all = [
    ...trades.rows.map((r: any) => ({
      id:         r.id,
      type:       'trade',
      title:      r.side === 'buy' ? 'Bought USDC' : 'Sold USDC',
      amount:     `${r.side === 'buy' ? '+' : '-'}${r.usdc_amount} USDC`,
      usdValue:   Number(r.usd_amount),
      status:     r.status,
      createdAt:  r.created_at,
    })),
    ...transfers.rows.map((r: any) => ({
      id:         r.id,
      type:       'usdc_transfer',
      title:      `Sent USDC to ${r.recipient}`,
      amount:     `-${r.usdc_amount} USDC`,
      usdValue:   0,
      note:       r.note,
      status:     r.status,
      createdAt:  r.created_at,
    })),
    ...usdTransfers.rows.map((r: any) => ({
      id:         r.id,
      type:       'usd_transfer',
      title:      `Sent $${Number(r.usd_amount).toFixed(2)} to ${r.recipient}`,
      amount:     `-$${Number(r.usd_amount).toFixed(2)}`,
      usdValue:   Number(r.usd_amount),
      note:       r.note,
      status:     r.status,
      createdAt:  r.created_at,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json({ history: all })
}

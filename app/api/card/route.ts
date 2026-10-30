import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getUserId } from '@/lib/session'

export const runtime = 'nodejs'

/** Generates a random 16-digit card number in groups of 4 */
function genCardNumber(): string {
  return Array.from({ length: 4 }, () =>
    String(Math.floor(1000 + Math.random() * 9000)),
  ).join(' ')
}

/** Generates expiry 3 years from now */
function genExpiry(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 3)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(2)
  return `${mm}/${yy}`
}

/** Generates a 3-digit CVV */
function genCvv(): string {
  return String(Math.floor(100 + Math.random() * 900))
}

// GET — fetch or auto-create the user's virtual card
export async function GET(request: Request) {
  try {
    const userId = await getUserId(request)

    const result = await db.execute(sql`
      SELECT id, card_number, expiry, cvv, card_name, frozen, created_at
      FROM virtual_cards
      WHERE user_id = ${userId}
    `)

    if (result.rows.length) {
      return NextResponse.json({ card: result.rows[0] })
    }

    // Auto-create card on first request
    const nameResult = await db.execute(sql`SELECT name FROM users WHERE id = ${userId}`)
    const cardName = ((nameResult.rows[0] as { name: string } | undefined)?.name ?? 'CARDHOLDER').toUpperCase()

    const cardNumber = genCardNumber()
    const expiry     = genExpiry()
    const cvv        = genCvv()

    const created = await db.execute(sql`
      INSERT INTO virtual_cards (user_id, card_number, expiry, cvv, card_name)
      VALUES (${userId}, ${cardNumber}, ${expiry}, ${cvv}, ${cardName})
      ON CONFLICT (user_id) DO NOTHING
      RETURNING id, card_number, expiry, cvv, card_name, frozen, created_at
    `)

    return NextResponse.json({ card: created.rows[0] ?? null })
  } catch (err) {
    console.error('[card] GET error:', err)
    return NextResponse.json({ card: null })
  }
}

// POST — freeze or unfreeze
export async function POST(request: Request) {
  try {
    const userId = await getUserId(request)
    const { action } = await request.json()

    if (action !== 'freeze' && action !== 'unfreeze') {
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 })
    }

    const frozen = action === 'freeze'

    await db.execute(sql`
      UPDATE virtual_cards
      SET frozen = ${frozen}, updated_at = now()
      WHERE user_id = ${userId}
    `)

    return NextResponse.json({ ok: true, frozen })
  } catch (err) {
    console.error('[card] POST error:', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

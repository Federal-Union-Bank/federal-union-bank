import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getUserId } from '@/lib/session'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const userId = await getUserId(request)
  const { pin } = await request.json()

  if (!pin || !/^\d{4}$/.test(String(pin))) {
    return NextResponse.json({ error: 'PIN must be exactly 4 digits.' }, { status: 400 })
  }

  const result = await db.execute(sql`
    SELECT pin_hash FROM user_profiles WHERE user_id = ${userId}
  `)

  const row = result.rows[0] as { pin_hash: string | null } | undefined

  if (!row || !row.pin_hash) {
    return NextResponse.json({ error: 'No PIN set. Please set your transaction PIN first.' }, { status: 400 })
  }

  const match = await bcrypt.compare(String(pin), row.pin_hash)
  if (!match) {
    return NextResponse.json({ error: 'Incorrect PIN. Please try again.' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

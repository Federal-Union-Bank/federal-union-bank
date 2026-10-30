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

  const pinHash = await bcrypt.hash(String(pin), 10)

  await db.execute(sql`
    UPDATE user_profiles
    SET pin_hash = ${pinHash}, updated_at = now()
    WHERE user_id = ${userId}
  `)

  return NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const { email, otp } = await request.json()

  if (!email || !otp) {
    return NextResponse.json({ error: 'Email and OTP are required.' }, { status: 400 })
  }

  // Find a valid, unused OTP for this email
  const result = await db.execute(sql`
    SELECT id, otp, expires_at
    FROM email_otps
    WHERE email = ${email}
      AND used = FALSE
      AND expires_at > now()
    ORDER BY created_at DESC
    LIMIT 1
  `)

  const row = result.rows[0] as { id: string; otp: string; expires_at: string } | undefined

  if (!row || row.otp !== String(otp)) {
    return NextResponse.json({ error: 'Invalid or expired code. Please try again.' }, { status: 400 })
  }

  // Mark OTP used
  await db.execute(sql`UPDATE email_otps SET used = TRUE WHERE id = ${row.id}`)

  // Mark user email as verified
  await db.execute(sql`
    UPDATE users SET email_verified = TRUE, updated_at = now()
    WHERE email = ${email}
  `)

  return NextResponse.json({ ok: true })
}

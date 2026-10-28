import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

// Generate a 6-digit OTP, store a bcrypt-style hash, email it.
// In production replace the console.log with a real email provider
// (Resend, SendGrid, Nodemailer, etc.).

function generateOtp() {
  return String(Math.floor(100_000 + Math.random() * 900_000))
}

export async function POST(request: Request) {
  const { email } = await request.json()
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }

  const otp       = generateOtp()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 min

  // Invalidate any previous unused OTPs for this email
  await db.execute(sql`
    UPDATE email_otps SET used = TRUE
    WHERE email = ${email} AND used = FALSE
  `)

  // Store plaintext OTP — in production, hash it with bcrypt
  await db.execute(sql`
    INSERT INTO email_otps (email, otp, expires_at)
    VALUES (${email}, ${otp}, ${expiresAt.toISOString()})
  `)

  // ── Send email ──────────────────────────────────────────────────────────
  // Replace this block with your real email provider.
  // Example with Resend:
  //   import { Resend } from 'resend'
  //   const resend = new Resend(process.env.RESEND_API_KEY)
  //   await resend.emails.send({ from: 'noreply@federalunionbank.com', to: email,
  //     subject: 'Your verification code', html: `<p>Your code: <b>${otp}</b></p>` })
  //
  // For local dev the OTP is logged to the server console:
  console.log(`\n📧  OTP for ${email}: ${otp}\n`)

  return NextResponse.json({ ok: true })
}

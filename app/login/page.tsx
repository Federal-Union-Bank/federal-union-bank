'use client'

import { useState, Suspense, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowRight, Check, Eye, EyeOff, KeyRound, Mail,
  ShieldCheck, User,
} from 'lucide-react'
import { signIn, signUp, useSession } from '@/lib/auth-client'

/* ── shared bits ────────────────────────────────────────────────────────── */

function BrandLeft() {
  return (
    <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-[#1b5cff] p-12 lg:flex">
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="relative flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-white/20 text-white backdrop-blur-sm"><ShieldCheck size={20} /></div>
        <span className="text-lg font-bold tracking-tight text-white">Federal Union Bank</span>
      </div>
      <div className="relative">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-blue-100">
          <span className="size-1.5 rounded-full bg-[#4ade80]" /> Secure · Verified · Insured
        </div>
        <h2 className="text-4xl font-bold leading-tight tracking-tight text-white">Banking built<br />for the digital age.</h2>
        <p className="mt-4 text-base leading-relaxed text-blue-200">Your money, simplified. Trade USDC, send transfers, pay bills, and grow your savings — all in one place.</p>
        <p className="mt-5 text-sm font-medium italic text-blue-300">&ldquo;Beyond banking. Beyond expectations.&rdquo;</p>
        <div className="mt-10 grid grid-cols-3 gap-4">
          {[{ v:'$10K', l:'Demo balance' },{ v:'Live', l:'USDC prices' },{ v:'100%', l:'Free to use' }].map(s => (
            <div key={s.l} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xl font-bold text-white">{s.v}</p><p className="mt-0.5 text-xs text-blue-200">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="relative text-xs text-blue-300">FDIC insured · 256-bit encryption · SOC 2 compliant</div>
    </div>
  )
}

function MobileLogo() {
  return (
    <div className="mb-8 flex items-center gap-3 lg:hidden">
      <div className="grid size-9 place-items-center rounded-xl bg-[#1b5cff] text-white"><ShieldCheck size={18} /></div>
      <span className="text-lg font-bold tracking-tight text-[#172033]">Federal Union Bank</span>
    </div>
  )
}

const inputClass = 'w-full rounded-xl border border-[#dfe5ee] bg-white px-4 py-3 text-sm text-[#172033] outline-none ring-0 transition placeholder:text-[#adb5bd] focus:border-[#1b5cff] focus:ring-2 focus:ring-[#1b5cff]/20'

const btnClass = 'mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b5cff] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1549d1] active:scale-[0.98] disabled:opacity-60'

/* ── main component ─────────────────────────────────────────────────────── */

type Step = 'credentials' | 'verify' | 'pin' | 'done'

function AuthForm() {
  const router = useRouter()
  const params  = useSearchParams()
  const next   = params.get('next') ?? '/dashboard'
  const { data: session, isPending } = useSession()

  const [step, setStep]             = useState<Step>('credentials')
  const [mode, setMode]             = useState<'login' | 'register'>('login')

  // If already logged in, skip straight to dashboard
  useEffect(() => {
    if (!isPending && session && step === 'credentials') {
      router.push(next)
    }
  }, [session, isPending, step, next, router])

  // shared fields
  const [name, setName]             = useState('')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)

  // OTP step
  const [otp, setOtp]               = useState(['', '', '', '', '', ''])
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // PIN step
  const [pin, setPin]               = useState(['', '', '', ''])
  const pinRefs = useRef<(HTMLInputElement | null)[]>([])
  const [confirmPin, setConfirmPin] = useState(['', '', '', ''])
  const confirmPinRefs = useRef<(HTMLInputElement | null)[]>([])

  // done step
  const [accountId, setAccountId]   = useState('')

  /* ── step 1: credentials ────────────────────────────────────────────── */
  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (mode === 'login') {
        const result = await signIn.email({ email, password })
        if (result.error) { setError(result.error.message ?? 'Sign-in failed.'); return }
        router.push(next)
      } else {
        const result = await signUp.email({ name, email, password })
        if (result.error) { setError(result.error.message ?? 'Registration failed.'); return }
        // Send OTP
        await fetch('/api/otp/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
        setStep('verify')
      }
    } catch { setError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  /* ── step 2: verify OTP ─────────────────────────────────────────────── */
  function handleOtpChange(i: number, val: string) {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]; next[i] = val; setOtp(next)
    if (val && i < 5) otpRefs.current[i + 1]?.focus()
  }
  function handleOtpKey(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
  }
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const code = otp.join('')
      const res = await fetch('/api/otp/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp: code }) })
      const result = await res.json()
      if (!res.ok) { setError(result.error ?? 'Verification failed.'); return }
      setStep('pin')
    } catch { setError('Something went wrong.') }
    finally { setLoading(false) }
  }
  async function handleResend() {
    setError('')
    await fetch('/api/otp/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
  }

  /* ── step 3: set PIN ────────────────────────────────────────────────── */
  function handlePinChange(refs: React.RefObject<(HTMLInputElement | null)[]>, state: string[], setState: (v: string[]) => void, i: number, val: string) {
    if (!/^\d?$/.test(val)) return
    const next = [...state]; next[i] = val; setState(next)
    if (val && i < 3) refs.current[i + 1]?.focus()
  }
  function handlePinKey(refs: React.RefObject<(HTMLInputElement | null)[]>, state: string[], i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !state[i] && i > 0) refs.current[i - 1]?.focus()
  }
  async function handleSetPin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const pinStr = pin.join('')
    const confirmStr = confirmPin.join('')
    if (pinStr.length !== 4 || confirmStr.length !== 4) { setError('Please enter all 4 digits.'); return }
    if (pinStr !== confirmStr) { setError('PINs do not match.'); return }
    setLoading(true)
    try {
      // Sign in the user now that email is verified
      const result = await signIn.email({ email, password })
      if (result.error) { setError(result.error.message ?? 'Could not sign in.'); return }
      // Set the PIN
      const res = await fetch('/api/pin/set', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: pinStr }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Could not set PIN.'); return }
      // Fetch account ID
      const profileRes = await fetch('/api/profile')
      const profile = await profileRes.json()
      setAccountId(profile.accountId ?? '')
      setStep('done')
    } catch { setError('Something went wrong.') }
    finally { setLoading(false) }
  }

  /* ── render ─────────────────────────────────────────────────────────── */

  return (
    <main className="flex min-h-screen bg-[#f0f4ff]">
      <BrandLeft />
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <MobileLogo />
        <div className="w-full max-w-[400px]">

          {/* ─── Step: credentials ─────────────────────────────────────── */}
          {step === 'credentials' && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-[#172033]">
                  {mode === 'login' ? 'Welcome back' : 'Create your account'}
                </h1>
                <p className="mt-1.5 text-sm text-[#73809a]">
                  {mode === 'login' ? 'Sign in to access your dashboard.' : 'Get started with a $10,000 demo balance.'}
                </p>
              </div>

              <div className="mb-6 flex rounded-xl bg-[#edf0f7] p-1">
                {(['login', 'register'] as const).map(m => (
                  <button key={m} type="button" onClick={() => { setMode(m); setError('') }}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${mode === m ? 'bg-white text-[#1b5cff] shadow-sm' : 'text-[#73809a] hover:text-[#172033]'}`}>
                    {m === 'login' ? 'Sign in' : 'Register'}
                  </button>
                ))}
              </div>

              {error && <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><span className="mt-0.5 shrink-0 text-red-400">⚠</span>{error}</div>}

              <form onSubmit={handleCredentials} className="flex flex-col gap-4">
                {mode === 'register' && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#374151]">Full name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#adb5bd]" />
                      <input required value={name} onChange={e => setName(e.target.value)} placeholder="Jordan Smith" autoComplete="name" className={`${inputClass} pl-10`} />
                    </div>
                  </div>
                )}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#374151]">Email address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#adb5bd]" />
                    <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className={`${inputClass} pl-10`} />
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-sm font-medium text-[#374151]">Password</label>
                    {mode === 'login' && <button type="button" className="text-xs font-medium text-[#1b5cff] hover:underline">Forgot password?</button>}
                  </div>
                  <div className="relative">
                    <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#adb5bd]" />
                    <input required type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={8}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className={`${inputClass} px-10`} />
                    <button type="button" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#506078]">{showPw ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                  </div>
                  {mode === 'register' && <p className="mt-1.5 text-xs text-[#9ca3af]">At least 8 characters.</p>}
                </div>
                <button type="submit" disabled={loading} className={btnClass}>
                  {loading ? <><span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Please wait…</>
                    : <>{mode === 'login' ? 'Sign in' : 'Create account'}<ArrowRight size={16} /></>}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-[#73809a]">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }} className="font-semibold text-[#1b5cff] hover:underline">
                  {mode === 'login' ? 'Register' : 'Sign in'}
                </button>
              </p>
            </>
          )}

          {/* ─── Step: verify email ────────────────────────────────────── */}
          {step === 'verify' && (
            <>
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-[#eef3ff] text-[#1b5cff]"><Mail size={26} /></div>
                <h1 className="text-2xl font-bold tracking-tight text-[#172033]">Verify your email</h1>
                <p className="mt-1.5 text-sm text-[#73809a]">We sent a 6-digit code to<br /><strong className="text-[#172033]">{email}</strong></p>
              </div>

              {error && <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><span className="mt-0.5 shrink-0 text-red-400">⚠</span>{error}</div>}

              <form onSubmit={handleVerify}>
                <div className="mb-6 flex justify-center gap-2">
                  {otp.map((d, i) => (
                    <input key={i} ref={el => { otpRefs.current[i] = el }} value={d}
                      onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKey(i, e)}
                      inputMode="numeric" maxLength={1}
                      className="size-12 rounded-xl border border-[#dfe5ee] text-center text-xl font-bold text-[#172033] outline-none focus:border-[#1b5cff] focus:ring-2 focus:ring-[#1b5cff]/20" />
                  ))}
                </div>
                <button type="submit" disabled={loading} className={btnClass}>
                  {loading ? <><span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Verifying…</>
                    : <>Verify email<ArrowRight size={16} /></>}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-[#73809a]">Didn&apos;t get the code? <button type="button" onClick={handleResend} className="font-semibold text-[#1b5cff] hover:underline">Resend</button></p>
              <p className="mt-4 text-center text-xs text-[#b0b8c8]">For local dev, the OTP code is printed in the server console.</p>
            </>
          )}

          {/* ─── Step: set PIN ──────────────────────────────────────────── */}
          {step === 'pin' && (
            <>
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-[#eef3ff] text-[#1b5cff]"><KeyRound size={26} /></div>
                <h1 className="text-2xl font-bold tracking-tight text-[#172033]">Set your transaction PIN</h1>
                <p className="mt-1.5 text-sm text-[#73809a]">You&apos;ll enter this 4-digit PIN before every transfer or payment.</p>
              </div>

              {error && <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><span className="mt-0.5 shrink-0 text-red-400">⚠</span>{error}</div>}

              <form onSubmit={handleSetPin}>
                <p className="mb-2 text-center text-sm font-medium text-[#374151]">Enter PIN</p>
                <div className="mb-5 flex justify-center gap-3">
                  {pin.map((d, i) => (
                    <input key={i} ref={el => { pinRefs.current[i] = el }} value={d} type="password"
                      onChange={e => handlePinChange(pinRefs, pin, setPin, i, e.target.value)} onKeyDown={e => handlePinKey(pinRefs, pin, i, e)}
                      inputMode="numeric" maxLength={1}
                      className="size-14 rounded-xl border border-[#dfe5ee] text-center text-2xl font-bold text-[#172033] outline-none focus:border-[#1b5cff] focus:ring-2 focus:ring-[#1b5cff]/20" />
                  ))}
                </div>
                <p className="mb-2 text-center text-sm font-medium text-[#374151]">Confirm PIN</p>
                <div className="mb-6 flex justify-center gap-3">
                  {confirmPin.map((d, i) => (
                    <input key={i} ref={el => { confirmPinRefs.current[i] = el }} value={d} type="password"
                      onChange={e => handlePinChange(confirmPinRefs, confirmPin, setConfirmPin, i, e.target.value)} onKeyDown={e => handlePinKey(confirmPinRefs, confirmPin, i, e)}
                      inputMode="numeric" maxLength={1}
                      className="size-14 rounded-xl border border-[#dfe5ee] text-center text-2xl font-bold text-[#172033] outline-none focus:border-[#1b5cff] focus:ring-2 focus:ring-[#1b5cff]/20" />
                  ))}
                </div>
                <button type="submit" disabled={loading} className={btnClass}>
                  {loading ? <><span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Saving…</>
                    : <>Set PIN<ArrowRight size={16} /></>}
                </button>
              </form>
            </>
          )}

          {/* ─── Step: done ────────────────────────────────────────────── */}
          {step === 'done' && (
            <div className="text-center">
              <div className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-green-100 text-green-600"><Check size={32} /></div>
              <h1 className="text-2xl font-bold tracking-tight text-[#172033]">Account created!</h1>
              <p className="mt-2 text-sm text-[#73809a]">Your Federal Union Bank account is ready. Here&apos;s your account number:</p>

              <div className="mt-6 rounded-2xl border border-[#1b5cff] bg-[#eef3ff] px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-widest text-[#73809a]">Account ID</p>
                <p className="mt-1 text-3xl font-bold tracking-wider text-[#1b5cff]">{accountId}</p>
              </div>
              <p className="mt-3 text-xs text-[#9ca3af]">Save this number — you&apos;ll need it to receive transfers.</p>

              <button onClick={() => router.push(next)} className={btnClass}>Go to dashboard<ArrowRight size={16} /></button>
            </div>
          )}

          {step === 'credentials' && (
            <p className="mt-8 text-center text-[11px] leading-relaxed text-[#b0b8c8]">
              By continuing you agree to our <span className="cursor-pointer underline hover:text-[#73809a]">Terms of Service</span> and <span className="cursor-pointer underline hover:text-[#73809a]">Privacy Policy</span>.<br />This is a demo application. No real money is involved.
            </p>
          )}
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return <Suspense><AuthForm /></Suspense>
}

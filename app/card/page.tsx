'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, Check, Copy, Eye, EyeOff,
  Lock, ShieldCheck, Unlock, Wifi,
} from 'lucide-react'
import { useSession } from '@/lib/auth-client'

type Card = {
  id: string
  card_number: string
  expiry: string
  cvv: string
  card_name: string
  frozen: boolean
  created_at: string
}

export default function CardPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  const [card, setCard]           = useState<Card | null>(null)
  const [loading, setLoading]     = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  const [freezing, setFreezing]   = useState(false)
  const [message, setMessage]     = useState('')
  const [copied, setCopied]       = useState<string | null>(null)

  useEffect(() => {
    if (!isPending && !session) router.push('/login?next=/card')
  }, [session, isPending, router])

  useEffect(() => {
    if (session) fetchCard()
  }, [session])

  async function fetchCard() {
    try {
      const res = await fetch('/api/card')
      const data = await res.json()
      setCard(data.card)
    } catch {}
    setLoading(false)
  }

  async function toggleFreeze() {
    if (!card) return
    setFreezing(true)
    const action = card.frozen ? 'unfreeze' : 'freeze'
    const res = await fetch('/api/card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const data = await res.json()
    if (!data.error) {
      setCard(prev => prev ? { ...prev, frozen: data.frozen } : prev)
      setMessage(data.frozen ? 'Card frozen. No transactions will be processed.' : 'Card unfrozen. Ready to use.')
      setTimeout(() => setMessage(''), 4000)
    }
    setFreezing(false)
  }

  function copyToClipboard(value: string, label: string) {
    navigator.clipboard?.writeText(value)
    setCopied(label)
    setTimeout(() => setCopied(null), 1500)
  }

  // Format card number with spaces masked or visible
  function formatNumber(num: string, show: boolean) {
    if (show) return num
    const parts = num.split(' ')
    return parts.map((p, i) => i < 3 ? '••••' : p).join(' ')
  }

  if (isPending || !session) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc] text-[#73809a]">Loading…</div>
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#172033]">

      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-[#e7ebf2] bg-white px-6 sm:px-8">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Federal Union Banking" width={200} height={56} className="h-14 w-auto object-contain" />
        </div>
        <Link href="/dashboard" className="flex items-center gap-2 rounded-lg border border-[#e0e6ef] bg-white px-3 py-2 text-sm font-medium text-[#506078] hover:bg-slate-50">
          <ArrowLeft size={15} /> Dashboard
        </Link>
      </header>

      <div className="mx-auto max-w-[640px] px-4 py-10 sm:px-6">

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">My Card</h1>
          <p className="mt-1 text-sm text-[#73809a]">Your Federal Union Banking virtual debit card.</p>
        </div>

        {/* Message banner */}
        {message && (
          <div className="mb-5 rounded-xl border border-[#cce1ff] bg-[#eef6ff] px-4 py-3 text-sm font-medium text-[#1555b5]">
            {message}
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-sm text-[#73809a]">Loading your card…</div>
        ) : !card ? (
          <div className="rounded-2xl border border-[#e3e8f0] bg-white py-16 text-center">
            <p className="font-medium text-[#506078]">Could not load your card. Try refreshing.</p>
          </div>
        ) : (
          <>
            {/* ── Card visual ─────────────────────────────────────────── */}
            <div className={`relative overflow-hidden rounded-3xl p-7 shadow-xl transition-all
              ${card.frozen
                ? 'bg-gradient-to-br from-[#64748b] to-[#334155]'
                : 'bg-gradient-to-br from-[#1b5cff] to-[#0a3fa8]'
              }`}
            >
              {/* Card background pattern */}
              <div className="pointer-events-none absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #fff 0%, transparent 60%)' }} />

              {/* Frozen overlay */}
              {card.frozen && (
                <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-black/30 backdrop-blur-[2px]">
                  <div className="flex flex-col items-center gap-2 text-white">
                    <Lock size={36} />
                    <span className="text-sm font-bold tracking-widest uppercase">Card Frozen</span>
                  </div>
                </div>
              )}

              {/* Top row */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">
                    Federal Union Banking
                  </p>
                  <p className="mt-0.5 text-xs text-blue-300">Virtual Debit Card</p>
                </div>
                <Wifi size={22} className="rotate-90 text-blue-200" />
              </div>

              {/* Chip */}
              <div className="mt-6 flex items-center gap-3">
                <div className="h-8 w-11 rounded-md bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-inner" />
              </div>

              {/* Card number */}
              <p className="mt-4 font-mono text-xl font-bold tracking-[0.2em] text-white">
                {formatNumber(card.card_number, showDetails)}
              </p>

              {/* Bottom row */}
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-blue-300">Card holder</p>
                  <p className="mt-0.5 text-sm font-semibold tracking-wider text-white">{card.card_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-blue-300">Expires</p>
                  <p className="mt-0.5 font-mono text-sm font-semibold text-white">
                    {showDetails ? card.expiry : '••/••'}
                  </p>
                </div>
                {/* Visa-style logo */}
                <div className="flex items-center">
                  <span className="font-serif text-xl font-extrabold italic text-white/90">VISA</span>
                </div>
              </div>
            </div>

            {/* ── Actions ─────────────────────────────────────────────── */}
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowDetails(v => !v)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#e3e8f0] bg-white py-3 text-sm font-semibold text-[#506078] hover:bg-slate-50"
              >
                {showDetails ? <EyeOff size={16} /> : <Eye size={16} />}
                {showDetails ? 'Hide details' : 'Show details'}
              </button>
              <button
                onClick={toggleFreeze}
                disabled={freezing}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition disabled:opacity-60
                  ${card.frozen
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
              >
                {card.frozen ? <Unlock size={16} /> : <Lock size={16} />}
                {freezing ? 'Please wait…' : card.frozen ? 'Unfreeze card' : 'Freeze card'}
              </button>
            </div>

            {/* ── Card details ────────────────────────────────────────── */}
            <div className="mt-5 overflow-hidden rounded-2xl border border-[#e3e8f0] bg-white">
              <h2 className="border-b border-[#f0f4f8] px-6 py-4 text-xs font-semibold uppercase tracking-widest text-[#9ca3af]">
                Card details
              </h2>
              <div className="divide-y divide-[#f0f4f8]">
                {[
                  { label: 'Card number',  value: card.card_number, copy: true },
                  { label: 'Expiry date',  value: card.expiry,      copy: false },
                  { label: 'CVV',          value: showDetails ? card.cvv : '•••', copy: showDetails },
                  { label: 'Card type',    value: 'Visa Debit',     copy: false },
                  { label: 'Card status',  value: card.frozen ? '🔒 Frozen' : '✅ Active', copy: false },
                  { label: 'Issued',       value: new Date(card.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), copy: false },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="text-xs text-[#9ca3af]">{row.label}</p>
                      <p className="mt-0.5 font-mono text-sm font-semibold text-[#172033]">
                        {row.label === 'Card number' && !showDetails
                          ? formatNumber(row.value, false)
                          : row.value}
                      </p>
                    </div>
                    {row.copy && (
                      <button
                        onClick={() => copyToClipboard(row.value, row.label)}
                        className="flex items-center gap-1.5 rounded-lg border border-[#e0e6ef] px-3 py-1.5 text-xs font-semibold text-[#506078] hover:bg-slate-50"
                      >
                        {copied === row.label ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                        {copied === row.label ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Security notice ─────────────────────────────────────── */}
            <div className="mt-5 flex items-start gap-3 rounded-xl bg-[#f0f4ff] px-5 py-4 text-sm text-[#3d5a9e]">
              <ShieldCheck size={18} className="mt-0.5 shrink-0" />
              <p>
                Never share your CVV or card number with anyone.
                Federal Union Banking will never ask for your full card details.
                Freeze your card instantly if you suspect unauthorised use.
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

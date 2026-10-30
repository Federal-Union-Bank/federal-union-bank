'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowDownLeft, ArrowUpRight, Check, Copy, Eye, EyeOff,
  Repeat2, Send, Settings, ShieldCheck, Wallet,
} from 'lucide-react'
import { useSession } from '@/lib/auth-client'
import PinModal from '@/components/PinModal'

type Dashboard = {
  balance: { usdc_balance: string; usd_balance: string }[]
  trades: any[]
  price: number
}

export default function Page() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  const [data, setData]               = useState<Dashboard | null>(null)
  const [showBalance, setShowBalance] = useState(true)
  const [mode, setMode]               = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount]           = useState('250')
  const [recipient, setRecipient]     = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [message, setMessage]         = useState('')
  const [loading, setLoading]         = useState(false)
  const [copied, setCopied]           = useState(false)

  // PIN modal
  const [pinOpen, setPinOpen]         = useState(false)
  const [pinAction, setPinAction]    = useState<(() => void) | null>(null)
  const [pinTitle, setPinTitle]      = useState('Enter your PIN')

  useEffect(() => {
    if (!isPending && !session) router.push('/login?next=/usdc')
  }, [session, isPending, router])

  async function refresh() {
    try {
      const res = await fetch('/api/trading')
      if (res.ok) setData(await res.json())
    } catch {}
  }
  useEffect(() => { if (session) refresh() }, [session])

  const balance = data?.balance?.[0]
  const usd     = Number(balance?.usd_balance  || 0)
  const usdc    = Number(balance?.usdc_balance || 0)
  const total   = useMemo(() => usd + usdc * (data?.price || 1), [usd, usdc, data?.price])

  const userName  = session?.user?.name ?? ''
  const initials  = userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'

  /* ── trade ──────────────────────────────────────────────────────────── */
  async function trade() {
    setLoading(true); setMessage('')
    const res    = await fetch('/api/trading', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ side: mode, amount }) })
    const result = await res.json()
    setMessage(result.error || `${mode === 'buy' ? 'Bought' : 'Sold'} ${amount} USDC successfully.`)
    await refresh()
    setLoading(false)
  }

  /* ── transfer (requires PIN) ────────────────────────────────────────── */
  async function doTransfer() {
    setPinOpen(false)
    setLoading(true); setMessage('')
    const res    = await fetch('/api/transfers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipient, amount: transferAmount }) })
    const result = await res.json()
    setMessage(result.error || `Sent ${transferAmount} USDC successfully.`)
    if (!result.error) { setRecipient(''); setTransferAmount(''); await refresh() }
    setLoading(false)
  }
  function requestTransfer() {
    if (!recipient.trim() || !transferAmount) return
    setPinAction(() => doTransfer)
    setPinTitle('Confirm transfer')
    setPinOpen(true)
  }

  if (isPending || !session) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc] text-[#73809a]">Loading…</div>
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#172033]">
      <PinModal open={pinOpen} title={pinTitle} onClose={() => setPinOpen(false)} onSuccess={() => pinAction?.()} />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="flex h-16 items-center justify-between border-b border-[#e7ebf2] bg-white px-6 sm:px-8">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Federal Union Banking" width={140} height={40} className="h-10 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-1">
          <Link href="/dashboard" className="flex items-center gap-2 rounded-lg border border-[#e0e6ef] bg-white px-3 py-2 text-sm font-medium text-[#506078] hover:bg-slate-50">
            ← Dashboard
          </Link>
          <Link href="/settings" aria-label="Account" className="ml-1 grid size-9 place-items-center rounded-full bg-[#dfe8ff] text-sm font-bold text-[#1b5cff] transition hover:ring-2 hover:ring-[#1b5cff]/30">
            {initials}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[860px] px-6 py-9">

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Trade USDC</h1>
          <p className="mt-1 text-sm text-[#73809a]">Buy and sell USDC instantly at live market rates.</p>
        </div>

        {/* Message banner */}
        {message && (
          <div className="mb-5 rounded-xl border border-[#cce1ff] bg-[#eef6ff] px-4 py-3 text-sm font-medium text-[#1555b5]">
            {message}
          </div>
        )}

        {/* Balance cards */}
        <section className="grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl bg-[#1b5cff] p-6 text-white shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-100">Total</span>
              <Wallet size={16} className="text-blue-200" />
            </div>
            <div className="mt-3 text-2xl font-bold">
              {showBalance ? `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '••••••'}
            </div>
          </div>
          <div className="rounded-2xl border border-[#e3e8f0] bg-white p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-[#73809a]">
              <span className="size-2 rounded-full bg-[#1b5cff]" /> USDC
            </div>
            <div className="mt-3 text-2xl font-bold">
              {showBalance ? `${usdc.toLocaleString()}` : '••••••'}
            </div>
            <p className="mt-1 text-xs text-[#73809a]">1 USDC = ${data?.price?.toFixed(4) ?? '1.0000'}</p>
          </div>
          <div className="rounded-2xl border border-[#e3e8f0] bg-white p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-[#73809a]">
              <span className="size-2 rounded-full bg-[#4ac38b]" /> USD cash
            </div>
            <div className="mt-3 text-2xl font-bold">
              {showBalance ? `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '••••••'}
            </div>
          </div>
        </section>

        {/* Trade + Send */}
        <section className="mt-7 grid gap-5 lg:grid-cols-2">
          {/* Trade */}
          <div className="rounded-2xl border border-[#e3e8f0] bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-bold">Trade USDC</h2>
                <p className="mt-1 text-sm text-[#73809a]">Instant settlement at a transparent rate.</p>
              </div>
              <Repeat2 size={20} className="text-[#1b5cff]" />
            </div>
            <div className="mb-4 flex rounded-lg bg-[#f1f4f8] p-1">
              <button onClick={() => setMode('buy')} className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${mode === 'buy' ? 'bg-white text-[#1b5cff] shadow-sm' : 'text-[#73809a]'}`}>Buy USDC</button>
              <button onClick={() => setMode('sell')} className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${mode === 'sell' ? 'bg-white text-[#1b5cff] shadow-sm' : 'text-[#73809a]'}`}>Sell USDC</button>
            </div>
            <label className="block text-sm font-medium text-[#506078]">
              USDC amount
              <input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal"
                className="mt-2 w-full rounded-lg border border-[#dfe5ee] px-4 py-3 text-lg outline-none focus:border-[#1b5cff]" />
            </label>
            <div className="mt-3 flex justify-between text-sm text-[#73809a]">
              <span>Estimated {mode === 'buy' ? 'cost' : 'proceeds'}</span>
              <b className="text-[#172033]">${(Number(amount || 0) * (data?.price || 1)).toFixed(2)}</b>
            </div>
            <button disabled={loading} onClick={trade} className="mt-5 w-full rounded-lg bg-[#1b5cff] py-3 font-semibold text-white hover:bg-[#1549d1] disabled:opacity-60">
              {loading ? 'Processing…' : mode === 'buy' ? 'Buy USDC' : 'Sell USDC'}
            </button>
          </div>

          {/* Send */}
          <div className="rounded-2xl border border-[#e3e8f0] bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-bold">Send USDC</h2>
                <p className="mt-1 text-sm text-[#73809a]">Transfer to any wallet. PIN required.</p>
              </div>
              <Send size={20} className="text-[#1b5cff]" />
            </div>
            <label className="block text-sm font-medium text-[#506078]">
              Recipient
              <input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="Wallet address or email"
                className="mt-2 w-full rounded-lg border border-[#dfe5ee] px-4 py-3 outline-none focus:border-[#1b5cff]" />
            </label>
            <label className="mt-4 block text-sm font-medium text-[#506078]">
              Amount
              <input value={transferAmount} onChange={e => setTransferAmount(e.target.value)} placeholder="0.00 USDC" inputMode="decimal"
                className="mt-2 w-full rounded-lg border border-[#dfe5ee] px-4 py-3 outline-none focus:border-[#1b5cff]" />
            </label>
            <button disabled={loading} onClick={requestTransfer} className="mt-5 w-full rounded-lg border border-[#1b5cff] py-3 font-semibold text-[#1b5cff] hover:bg-[#f1f5ff] disabled:opacity-60">
              {loading ? 'Processing…' : 'Review transfer'}
            </button>
          </div>
        </section>

        {/* Recent trades */}
        <section className="mt-7 rounded-2xl border border-[#e3e8f0] bg-white p-6">
          <h2 className="mb-4 font-bold">Recent trades</h2>
          <div className="flex flex-col gap-3">
            {data?.trades?.slice(0, 6).map(t => (
              <div key={t.id} className="flex items-center justify-between rounded-lg bg-[#f8fafc] p-3">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-full bg-[#eaf1ff] text-[#1b5cff]">
                    {t.side === 'buy' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.side === 'buy' ? 'Bought' : 'Sold'} USDC</p>
                    <p className="text-xs text-[#73809a]">{new Date(t.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <b className="text-sm">{t.side === 'buy' ? '+' : '-'}{t.usdc_amount} USDC</b>
              </div>
            ))}
            {!data?.trades?.length && <p className="py-5 text-center text-sm text-[#73809a]">Your completed trades will appear here.</p>}
          </div>
        </section>
      </div>
    </main>
  )
}

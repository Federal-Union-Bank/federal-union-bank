'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'
import {
  ArrowUpRight, Check, Copy, Droplets, Eye, EyeOff,
  CreditCard, Gift, History, Phone, PiggyBank,
  Send, Settings, ShieldCheck, TrendingUp,
  Wallet, Wifi, Zap,
} from 'lucide-react'
import { useSession } from '@/lib/auth-client'
import PinModal from '@/components/PinModal'

type BalanceData = {
  balance: { usd_balance: string }[]
  price: number
}

type Profile = {
  accountId: string
  pinSet: boolean
  referralCode: string
  isAdmin: boolean
}

type Savings = {
  balance: string
  rate: string
}

type RecentTx = {
  id: string
  recipient: string
  usd_amount: string
  note: string
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  const [balData, setBalData]       = useState<BalanceData | null>(null)
  const [profile, setProfile]       = useState<Profile | null>(null)
  const [savings, setSavings]       = useState<Savings | null>(null)
  const [recentTxs, setRecentTxs]   = useState<RecentTx[]>([])
  const [showBalance, setShowBalance] = useState(true)

  // Transfer form
  const [recipient, setRecipient]   = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [transferNote, setTransferNote] = useState('')
  const [message, setMessage]       = useState('')
  const [loading, setLoading]       = useState(false)
  const [copiedAcct, setCopiedAcct]  = useState(false)

  // PIN modal
  const [pinOpen, setPinOpen]       = useState(false)
  const [pinAction, setPinAction]  = useState<(() => void) | null>(null)
  const [pinTitle, setPinTitle]    = useState('Enter your PIN')

  // Savings modal
  const [savingsModal, setSavingsModal] = useState<'deposit' | 'withdraw' | null>(null)
  const [savingsAmount, setSavingsAmount] = useState('')

  useEffect(() => {
    if (!isPending && !session) router.push('/login?next=/dashboard')
  }, [session, isPending, router])

  async function refresh() {
    try {
      const [balRes, profileRes, savingsRes, txRes] = await Promise.all([
        fetch('/api/trading').catch(() => null),
        fetch('/api/profile').catch(() => null),
        fetch('/api/savings').catch(() => null),
        fetch('/api/transfers/usd?recent=1').catch(() => null),
      ])
      if (balRes?.ok)     { try { setBalData(await balRes.json()) }     catch {} }
      if (profileRes?.ok)  { try { setProfile(await profileRes.json()) } catch {} }
      if (savingsRes?.ok)  { try { setSavings(await savingsRes.json()) } catch {} }
      // Recent USD transfers aren't in the trading API — we'll derive from history
      if (txRes?.ok)       { try { setRecentTxs(await txRes.json()) }    catch {} }
    } catch {}
  }
  useEffect(() => { if (session) refresh() }, [session])

  const usd     = Number(balData?.balance?.[0]?.usd_balance || 0)
  const total   = useMemo(() => usd, [usd])
  const savingsBal  = Number(savings?.balance || 0)
  const savingsRate = Number(savings?.rate || 0.05) * 100

  const userName  = session?.user?.name ?? ''
  const firstName = userName.split(' ')[0] || 'there'
  const initials  = userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'

  // Check admin directly from the session email — no API call needed
  const ADMIN_EMAIL = 'admin@federalunion.com'
  const isAdmin = session?.user?.email === ADMIN_EMAIL || profile?.isAdmin === true
  const greeting  = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  /* ── transfer (requires PIN) ─────────────────────────────────────────── */
  async function doTransfer() {
    setPinOpen(false)
    setLoading(true); setMessage('')
    const res = await fetch('/api/transfers/usd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient, amount: transferAmount, note: transferNote }),
    })
    const result = await res.json()
    setMessage(result.error || `Sent $${Number(transferAmount).toFixed(2)} to ${recipient} successfully.`)
    if (!result.error) { setRecipient(''); setTransferAmount(''); setTransferNote(''); await refresh() }
    setLoading(false)
  }
  function requestTransfer() {
    if (!recipient.trim() || !transferAmount) return
    setPinAction(() => doTransfer)
    setPinTitle('Confirm transfer')
    setPinOpen(true)
  }

  /* ── savings (requires PIN) ──────────────────────────────────────────── */
  async function doSavingsAction() {
    setPinOpen(false)
    setLoading(true); setMessage('')
    const res = await fetch('/api/savings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: savingsModal, amount: savingsAmount }),
    })
    const result = await res.json()
    if (result.error) {
      setMessage(result.error)
    } else {
      setMessage(`${savingsModal === 'deposit' ? 'Deposited' : 'Withdrew'} $${Number(savingsAmount).toFixed(2)} ${savingsModal === 'deposit' ? 'into' : 'from'} savings.`)
      setSavingsAmount('')
      setSavingsModal(null)
      await refresh()
    }
    setLoading(false)
  }
  function requestSavingsAction() {
    if (!savingsAmount) return
    setPinAction(() => doSavingsAction)
    setPinTitle(savingsModal === 'deposit' ? 'Confirm savings deposit' : 'Confirm savings withdrawal')
    setPinOpen(true)
  }

  function copyAccountId() {
    if (!profile?.accountId) return
    navigator.clipboard?.writeText(profile.accountId)
    setCopiedAcct(true)
    setTimeout(() => setCopiedAcct(false), 1500)
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
          <Logo className="h-10 w-auto" />
        </div>
        <div className="flex items-center gap-1">
          {/* Trade USDC button — top right */}
          <Link href="/usdc" className="mr-2 flex items-center gap-2 rounded-lg bg-[#1b5cff] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1549d1]">
            <Zap size={15} /> Trade USDC
          </Link>
          <Link href="/card" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#506078] hover:bg-[#f1f4f8]">
            <CreditCard size={16} /><span className="hidden sm:inline">Card</span>
          </Link>
          <Link href="/history" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#506078] hover:bg-[#f1f4f8]">
            <History size={16} /><span className="hidden sm:inline">History</span>
          </Link>
          <Link href="/settings" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#506078] hover:bg-[#f1f4f8]">
            <Settings size={16} /><span className="hidden sm:inline">Settings</span>
          </Link>
          {isAdmin && (
            <Link href="/admin" className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100">
              <ShieldCheck size={16} /><span className="hidden sm:inline">Admin</span>
            </Link>
          )}
          <Link href="/settings" aria-label="Account" className="ml-1 grid size-9 place-items-center rounded-full bg-[#dfe8ff] text-sm font-bold text-[#1b5cff] transition hover:ring-2 hover:ring-[#1b5cff]/30">
            {initials}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1180px] px-6 py-9">

        {/* Greeting + account number */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-[#73809a]">{today}</p>
            <h1 className="text-3xl font-bold tracking-tight">{greeting}, {firstName}</h1>
            <p className="mt-2 text-[#73809a]">Here&apos;s your financial overview.</p>
            {profile?.accountId && (
              <button onClick={copyAccountId} className="mt-2 inline-flex items-center gap-2 rounded-lg border border-[#e3e8f0] bg-white px-3 py-1.5 text-xs font-medium text-[#506078] hover:bg-slate-50">
                <span className="text-[#9ca3af]">Acct:</span>
                <span className="font-bold text-[#172033]">{profile.accountId}</span>
                {copiedAcct ? <Check size={13} className="text-green-500" /> : <Copy size={13} className="text-[#9ca3af]" />}
              </button>
            )}
          </div>
          <button onClick={() => setShowBalance(v => !v)} className="flex items-center gap-2 rounded-lg border border-[#e0e6ef] bg-white px-4 py-2 text-sm font-semibold text-[#506078] hover:bg-slate-50">
            {showBalance ? <EyeOff size={15} /> : <Eye size={15} />}
            {showBalance ? 'Hide' : 'Show'}
          </button>
        </div>

        {/* Message banner */}
        {message && (
          <div className="mb-5 rounded-xl border border-[#cce1ff] bg-[#eef6ff] px-4 py-3 text-sm font-medium text-[#1555b5]">
            {message}
          </div>
        )}

        {/* Balance card */}
        <section className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl bg-[#1b5cff] p-7 text-white shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-100">Available balance</span>
              <Wallet size={18} className="text-blue-200" />
            </div>
            <div className="mt-4 text-4xl font-bold tracking-tight">
              {showBalance ? `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '••••••'}
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-blue-100">
              <TrendingUp size={15} /> +2.4% this month
            </div>
          </div>
          <div className="rounded-2xl border border-[#e3e8f0] bg-white p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-[#73809a]">
              <span className="size-2 rounded-full bg-[#4ac38b]" /> Savings
            </div>
            <div className="mt-4 text-2xl font-bold">
              {showBalance ? `$${savingsBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '••••••'}
            </div>
            <p className="mt-2 text-sm text-[#73809a]">{savingsRate.toFixed(1)}% APY</p>
          </div>
        </section>

        {/* Savings (OWealth-style) card */}
        <section className="mt-5 rounded-2xl border border-[#e3e8f0] bg-gradient-to-r from-[#4ac38b] to-[#2dd4bf] p-6 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-xl bg-white/20 text-white backdrop-blur-sm">
                <PiggyBank size={22} />
              </div>
              <div>
                <h2 className="font-bold">Union Savings</h2>
                <p className="text-sm text-green-100">Earn {savingsRate.toFixed(1)}% APY on your idle cash</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                {showBalance ? `$${savingsBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '••••••'}
              </p>
              <p className="text-xs text-green-100">Total saved</p>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button onClick={() => setSavingsModal('deposit')} className="flex-1 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/30">Deposit</button>
            <button onClick={() => setSavingsModal('withdraw')} className="flex-1 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/30">Withdraw</button>
          </div>
        </section>

        {/* Referral banner */}
        {profile?.referralCode && (
          <section className="mt-5 flex items-center gap-4 rounded-2xl border border-[#e3e8f0] bg-white p-5">
            <div className="grid size-10 place-items-center rounded-xl bg-[#eef3ff] text-[#1b5cff]">
              <Gift size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#172033]">Refer a friend, earn $10</p>
              <p className="text-xs text-[#73809a]">Share your code and you both get $10 when they sign up.</p>
            </div>
            <button onClick={() => { navigator.clipboard?.writeText(profile.referralCode); setMessage(`Referral code copied: ${profile.referralCode}`) }}
              className="rounded-lg border border-[#1b5cff] bg-[#eef3ff] px-4 py-2 text-sm font-bold text-[#1b5cff] hover:bg-[#dfe8ff]">
              {profile.referralCode}
            </button>
          </section>
        )}

        {/* Transfer only — deposit is admin-only */}
        <section className="mt-7 rounded-2xl border border-[#e3e8f0] bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-bold">Send money</h2>
              <p className="mt-1 text-sm text-[#73809a]">Transfer dollars to any account. PIN required.</p>
            </div>
            <Send size={20} className="text-[#1b5cff]" />
          </div>
            <label className="block text-sm font-medium text-[#506078]">
              Recipient (account number or email)
              <input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="e.g. 7823041965"
                className="mt-2 w-full rounded-lg border border-[#dfe5ee] px-4 py-3 outline-none focus:border-[#1b5cff]" />
            </label>
            <label className="mt-4 block text-sm font-medium text-[#506078]">
              Amount (USD)
              <input value={transferAmount} onChange={e => setTransferAmount(e.target.value)} placeholder="0.00" inputMode="decimal"
                className="mt-2 w-full rounded-lg border border-[#dfe5ee] px-4 py-3 outline-none focus:border-[#1b5cff]" />
            </label>
            <label className="mt-4 block text-sm font-medium text-[#506078]">
              Note (optional)
              <input value={transferNote} onChange={e => setTransferNote(e.target.value)} placeholder="What's this for?"
                className="mt-2 w-full rounded-lg border border-[#dfe5ee] px-4 py-3 outline-none focus:border-[#1b5cff]" />
            </label>
            <button disabled={loading} onClick={requestTransfer} className="mt-5 w-full rounded-lg bg-[#1b5cff] py-3 font-semibold text-white hover:bg-[#1549d1] disabled:opacity-60">
              {loading ? 'Processing…' : 'Review transfer'}
            </button>
          </section>

        {/* Services */}
        <section className="mt-7 rounded-2xl border border-[#e3e8f0] bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-bold">Everyday services</h2>
              <p className="mt-1 text-sm text-[#73809a]">Pay bills and manage your essentials.</p>
            </div>
            <Zap size={20} className="text-[#1b5cff]" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { href: '/services/electricity', icon: <Zap size={20} />,    label: 'Electricity', sub: 'Pay your bill'     },
              { href: '/services/airtime',     icon: <Phone size={20} />,  label: 'Airtime',     sub: 'Top up instantly' },
              { href: '/services/data',        icon: <Wifi size={20} />,   label: 'Data',        sub: 'Stay connected'   },
              { href: '/services/loans',       icon: <Wallet size={20} />, label: 'Loans',       sub: 'Explore options'  },
              { href: '/services/credit',      icon: <Droplets size={20}/>,label: 'Credit',      sub: 'Build your score' },
            ].map(s => (
              <Link key={s.href} href={s.href} className="rounded-xl border border-[#e3e8f0] p-4 transition hover:border-[#1b5cff] hover:bg-[#f8faff]">
                <div className="mb-3 text-[#1b5cff]">{s.icon}</div>
                <b className="block text-sm">{s.label}</b>
                <span className="text-xs text-[#73809a]">{s.sub}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent activity + Quick actions */}
        <section className="mt-7 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#e3e8f0] bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">Recent activity</h2>
              <Link href="/history" className="text-xs font-semibold text-[#1b5cff] hover:underline">View all</Link>
            </div>
            <div className="flex flex-col gap-3">
              {recentTxs.slice(0, 4).map(tx => (
                <div key={tx.id} className="flex items-center justify-between rounded-lg bg-[#f8fafc] p-3">
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 place-items-center rounded-full bg-[#eaf1ff] text-[#1b5cff]">
                      <ArrowUpRight size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Sent to {tx.recipient}</p>
                      <p className="text-xs text-[#73809a]">{new Date(tx.created_at).toLocaleDateString()}{tx.note ? ` · ${tx.note}` : ''}</p>
                    </div>
                  </div>
                  <b className="text-sm text-red-500">-${Number(tx.usd_amount).toFixed(2)}</b>
                </div>
              ))}
              {!recentTxs.length && <p className="py-5 text-center text-sm text-[#73809a]">Your transactions will appear here.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-[#e3e8f0] bg-white p-6">
            <h2 className="mb-4 font-bold">Quick actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/usdc" className="rounded-xl border border-[#e3e8f0] p-4 text-left transition hover:border-[#1b5cff] hover:bg-[#f8faff]">
                <Zap size={20} className="mb-3 text-[#1b5cff]" />
                <b className="block text-sm">Trade USDC</b>
                <span className="text-xs text-[#73809a]">Buy or sell</span>
              </Link>
              <button onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })} className="rounded-xl border border-[#e3e8f0] p-4 text-left transition hover:border-[#1b5cff] hover:bg-[#f8faff]">
                <Send size={20} className="mb-3 text-[#1b5cff]" />
                <b className="block text-sm">Send money</b>
                <span className="text-xs text-[#73809a]">Transfer funds</span>
              </button>
              <Link href="/history" className="rounded-xl border border-[#e3e8f0] p-4 text-left transition hover:border-[#1b5cff] hover:bg-[#f8faff]">
                <History size={20} className="mb-3 text-[#1b5cff]" />
                <b className="block text-sm">History</b>
                <span className="text-xs text-[#73809a]">All transactions</span>
              </Link>
              <Link href="/card" className="rounded-xl border border-[#e3e8f0] p-4 text-left transition hover:border-[#1b5cff] hover:bg-[#f8faff]">
                <CreditCard size={20} className="mb-3 text-[#1b5cff]" />
                <b className="block text-sm">My card</b>
                <span className="text-xs text-[#73809a]">View & manage</span>
              </Link>
            </div>
          </div>
        </section>

        <footer className="mt-8 border-t border-[#e3e8f0] py-5 text-xs text-[#8a96a8]">
          Securely powered by Federal Union Bank
        </footer>
      </div>

      {/* ── Savings modal ──────────────────────────────────────────────── */}
      {savingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSavingsModal(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-[#e3e8f0] bg-white p-7 shadow-xl">
            <h2 className="text-lg font-bold tracking-tight text-[#172033]">
              {savingsModal === 'deposit' ? 'Deposit to savings' : 'Withdraw from savings'}
            </h2>
            <p className="mt-1 text-sm text-[#73809a]">
              {savingsModal === 'deposit' ? 'Move USD from your main account into savings.' : 'Move money from savings back to your main account.'}
            </p>
            <div className="mt-5">
              <label className="text-sm font-medium text-[#506078]">
                Amount (USD)
                <input value={savingsAmount} onChange={e => setSavingsAmount(e.target.value)} placeholder="0.00" inputMode="decimal" autoFocus
                  className="mt-2 w-full rounded-xl border border-[#dfe5ee] px-4 py-3 text-lg outline-none focus:border-[#1b5cff]" />
              </label>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setSavingsModal(null)} className="flex-1 rounded-xl border border-[#e0e6ef] py-3 text-sm font-semibold text-[#506078] hover:bg-slate-50">Cancel</button>
              <button onClick={requestSavingsAction} disabled={!savingsAmount} className="flex-1 rounded-xl bg-[#1b5cff] py-3 text-sm font-semibold text-white hover:bg-[#1549d1] disabled:opacity-60">Continue</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'
import {
  ArrowUpRight, Check, Eye, EyeOff, Plus, Search,
  ShieldCheck, TrendingUp, Users, Wallet,
} from 'lucide-react'
import { useSession } from '@/lib/auth-client'

type UserRow = {
  id: string
  name: string
  email: string
  is_admin: boolean
  created_at: string
  account_id: string
  usd_balance: string
  usdc_balance: string
  savings_balance: string
}

type Stats = {
  users: { total: string; regular: string; admins: string }
  balances: { total_usd: string; total_usdc: string; accounts_with_balance: string }
  savings: { total_savings: string }
  recentTransactions: { type: string; user_id: string; amount: string; created_at: string }[]
}

export default function AdminPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showBalances, setShowBalances] = useState(true)
  const [authorized, setAuthorized] = useState(true)

  // Fund modal
  const [fundUser, setFundUser] = useState<UserRow | null>(null)
  const [fundAmount, setFundAmount] = useState('')
  const [fundMsg, setFundMsg] = useState('')
  const [funding, setFunding] = useState(false)

  useEffect(() => {
    if (!isPending && !session) router.push('/login?next=/admin')
  }, [session, isPending, router])

  useEffect(() => {
    if (session) loadData()
  }, [session])

  async function loadData() {
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users'),
      ])

      if (statsRes.status === 401 || usersRes.status === 401) {
        setAuthorized(false)
        setLoading(false)
        return
      }

      if (statsRes.ok) setStats(await statsRes.json())
      if (usersRes.ok) setUsers((await usersRes.json()).users ?? [])
    } catch {}
    setLoading(false)
  }

  async function handleFund() {
    if (!fundUser || !fundAmount) return
    setFunding(true); setFundMsg('')
    const res = await fetch('/api/admin/fund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: fundUser.id, amount: fundAmount }),
    })
    const result = await res.json()
    if (result.error) {
      setFundMsg(result.error)
    } else {
      setFundMsg(`Funded $${Number(fundAmount).toFixed(2)} to ${fundUser.name}.`)
      setFundAmount('')
      await loadData()
      setTimeout(() => { setFundUser(null); setFundMsg('') }, 1500)
    }
    setFunding(false)
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.account_id?.includes(search)
  )

  if (isPending || !session) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc] text-[#73809a]">Loading…</div>
  }

  if (!authorized) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#f7f9fc] gap-4">
        <div className="grid size-16 place-items-center rounded-full bg-red-50 text-red-500">
          <ShieldCheck size={30} />
        </div>
        <h1 className="text-xl font-bold text-[#172033]">Access denied</h1>
        <p className="text-sm text-[#73809a]">You need admin privileges to access this page.</p>
        <Link href="/dashboard" className="rounded-lg bg-[#1b5cff] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1549d1]">
          Back to dashboard
        </Link>
      </main>
    )
  }

  const totalUsd = Number(stats?.balances?.total_usd || 0)
  const totalUsdc = Number(stats?.balances?.total_usdc || 0)
  const totalSavings = Number(stats?.savings?.total_savings || 0)
  const totalUsers = Number(stats?.users?.regular || 0)

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#172033]">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-[#e7ebf2] bg-white px-6 sm:px-8">
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-auto" />
        </div>
        <Link href="/dashboard" className="flex items-center gap-2 rounded-lg border border-[#e0e6ef] bg-white px-3 py-2 text-sm font-medium text-[#506078] hover:bg-slate-50">
          ← Dashboard
        </Link>
      </header>

      <div className="mx-auto max-w-[1200px] px-6 py-8">

        {/* Stats overview */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-[#73809a]">Monitor and manage all accounts.</p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total users */}
          <div className="rounded-2xl border border-[#e3e8f0] bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#73809a]">Total users</span>
              <div className="grid size-8 place-items-center rounded-lg bg-[#eef3ff] text-[#1b5cff]">
                <Users size={16} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold">{totalUsers}</p>
          </div>

          {/* Total USD */}
          <div className="rounded-2xl bg-[#1b5cff] p-5 text-white shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-100">Total USD held</span>
              <Wallet size={16} className="text-blue-200" />
            </div>
            <p className="mt-3 text-2xl font-bold">
              ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Total USDC */}
          <div className="rounded-2xl border border-[#e3e8f0] bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#73809a]">Total USDC held</span>
              <TrendingUp size={16} className="text-[#1b5cff]" />
            </div>
            <p className="mt-3 text-2xl font-bold">{totalUsdc.toLocaleString()} USDC</p>
          </div>

          {/* Total savings */}
          <div className="rounded-2xl border border-[#e3e8f0] bg-gradient-to-br from-[#4ac38b] to-[#2dd4bf] p-5 text-white shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-green-100">Total savings</span>
              <span className="text-xs text-green-100">APY 5%</span>
            </div>
            <p className="mt-3 text-2xl font-bold">
              ${totalSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* User table */}
        <div className="rounded-2xl border border-[#e3e8f0] bg-white">
          {/* Header row */}
          <div className="flex items-center justify-between border-b border-[#e3e8f0] px-6 py-4">
            <h2 className="font-bold">All accounts</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search name, email, account ID…"
                  className="rounded-lg border border-[#dfe5ee] py-2 pl-9 pr-4 text-sm outline-none focus:border-[#1b5cff] w-64"
                />
              </div>
              <button
                onClick={() => setShowBalances(v => !v)}
                className="rounded-lg border border-[#e0e6ef] p-2 text-[#506078] hover:bg-slate-50"
                aria-label="Toggle balances"
              >
                {showBalances ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

            {/* Fund modal trigger already exists — also add quick deposit section */}
          <div className="mb-8 rounded-2xl border border-[#e3e8f0] bg-white p-6">
            <h2 className="mb-1 font-bold">Fund a user account</h2>
            <p className="mb-5 text-sm text-[#73809a]">Search for a user below and click <strong>Fund</strong> to add USD to their balance.</p>
            <div className="flex items-center gap-3 rounded-xl bg-[#f5f8ff] px-4 py-3 text-sm text-[#3d5a9e]">
              <ShieldCheck size={16} />
              Only admin accounts can deposit funds. Regular users can only transfer.
            </div>
          </div>
            <div className="py-16 text-center text-sm text-[#73809a]">Loading accounts…</div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-sm text-[#73809a]">No accounts found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f0f4f8] text-left text-xs font-semibold uppercase tracking-widest text-[#9ca3af]">
                    <th className="px-6 py-3">User</th>
                    <th className="px-4 py-3">Account ID</th>
                    <th className="px-4 py-3 text-right">USD Balance</th>
                    <th className="px-4 py-3 text-right">USDC</th>
                    <th className="px-4 py-3 text-right">Savings</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f4f8]">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-[#f8fafc]">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold
                            ${u.is_admin ? 'bg-amber-100 text-amber-700' : 'bg-[#dfe8ff] text-[#1b5cff]'}`}>
                            {u.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#172033]">
                              {u.name}
                              {u.is_admin && (
                                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">ADMIN</span>
                              )}
                            </p>
                            <p className="text-xs text-[#9ca3af] truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <code className="rounded bg-[#f1f4f8] px-2 py-1 text-xs text-[#506078]">{u.account_id || '—'}</code>
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold">
                        {showBalances ? `$${Number(u.usd_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '••••'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-[#73809a]">
                        {showBalances ? `${Number(u.usdc_balance || 0).toLocaleString()}` : '••••'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-[#73809a]">
                        {showBalances ? `$${Number(u.savings_balance || 0).toFixed(2)}` : '••••'}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[#9ca3af]">
                        {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {!u.is_admin && (
                          <button
                            onClick={() => { setFundUser(u); setFundAmount(''); setFundMsg('') }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1b5cff] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1549d1]"
                          >
                            <Plus size={14} /> Fund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-[#b0b8c8]">
          Admin: {session?.user?.email} · Federal Union Bank
        </p>
      </div>

      {/* ── Fund modal ────────────────────────────────────────────────── */}
      {fundUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setFundUser(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-[#e3e8f0] bg-white p-7 shadow-xl">
            <h2 className="text-lg font-bold tracking-tight text-[#172033]">Fund account</h2>
            <p className="mt-1 text-sm text-[#73809a]">
              Add USD to <strong className="text-[#172033]">{fundUser.name}</strong>&apos;s balance.
            </p>
            <div className="mt-2 rounded-lg bg-[#f1f4f8] px-3 py-2 text-xs text-[#506078]">
              Current balance: ${Number(fundUser.usd_balance || 0).toFixed(2)}
            </div>
            <div className="mt-5">
              <label className="text-sm font-medium text-[#506078]">
                Amount (USD)
                <input
                  value={fundAmount}
                  onChange={e => setFundAmount(e.target.value)}
                  placeholder="0.00"
                  inputMode="decimal"
                  autoFocus
                  className="mt-2 w-full rounded-xl border border-[#dfe5ee] px-4 py-3 text-lg outline-none focus:border-[#1b5cff]"
                />
              </label>
              <div className="mt-2 flex gap-2">
                {['50', '100', '500', '1000'].map(a => (
                  <button key={a} onClick={() => setFundAmount(a)}
                    className="flex-1 rounded-lg border border-[#dfe5ee] py-2 text-xs font-semibold text-[#506078] hover:border-[#1b5cff] hover:text-[#1b5cff]">
                    ${a}
                  </button>
                ))}
              </div>
            </div>
            {fundMsg && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                <Check size={16} /> {fundMsg}
              </div>
            )}
            <div className="mt-5 flex gap-3">
              <button onClick={() => setFundUser(null)} className="flex-1 rounded-xl border border-[#e0e6ef] py-3 text-sm font-semibold text-[#506078] hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleFund} disabled={funding || !fundAmount} className="flex-1 rounded-xl bg-[#1b5cff] py-3 text-sm font-semibold text-white hover:bg-[#1549d1] disabled:opacity-60">
                {funding ? 'Funding…' : 'Fund account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

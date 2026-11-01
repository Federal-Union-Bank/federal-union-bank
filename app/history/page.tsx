'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowDownLeft, ArrowUpRight, ArrowLeft,
  Check, Clock, ShieldCheck, Send,
} from 'lucide-react'
import { useSession } from '@/lib/auth-client'

type Tx = {
  id: string
  type: 'trade' | 'transfer'
  title: string
  amount: string
  usdValue: number
  note?: string
  status: string
  createdAt: string
}

function groupByDate(txs: Tx[]) {
  const groups: Record<string, Tx[]> = {}
  for (const tx of txs) {
    const date = new Date(tx.createdAt).toLocaleDateString('en-US', {
      weekday: 'long', month: 'short', day: 'numeric',
    })
    if (!groups[date]) groups[date] = []
    groups[date].push(tx)
  }
  return groups
}

export default function HistoryPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [txs, setTxs] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isPending && !session) router.push('/login?next=/history')
  }, [session, isPending, router])

  useEffect(() => {
    if (session) loadHistory()
  }, [session])

  async function loadHistory() {
    const res = await fetch('/api/history')
    const data = await res.json()
    setTxs(data.history ?? [])
    setLoading(false)
  }

  if (isPending || !session) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc] text-[#73809a]">Loading…</div>
  }

  const groups = groupByDate(txs)

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#172033]">
      {/* Header */}
      <header className="flex h-20 items-center justify-between border-b border-[#e7ebf2] bg-white px-6 sm:px-8">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Federal Union Banking" width={220} height={70} className="w-48 object-contain" />
        </div>
        <Link href="/dashboard" className="flex items-center gap-2 rounded-lg border border-[#e0e6ef] bg-white px-3 py-2 text-sm font-medium text-[#506078] hover:bg-slate-50">
          <ArrowLeft size={15} /> Dashboard
        </Link>
      </header>

      <div className="mx-auto max-w-[760px] px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Transaction history</h1>
            <p className="text-sm text-[#73809a]">All your trades and transfers in one place.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-[#73809a]">Loading your transactions…</div>
        ) : txs.length === 0 ? (
          <div className="rounded-2xl border border-[#e3e8f0] bg-white py-16 text-center">
            <Clock size={32} className="mx-auto mb-3 text-[#c8d0dc]" />
            <p className="font-medium text-[#506078]">No transactions yet</p>
            <p className="mt-1 text-sm text-[#9ca3af]">Your trades and transfers will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {Object.entries(groups).map(([date, items]) => (
              <div key={date}>
                <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-[#9ca3af]">{date}</p>
                <div className="overflow-hidden rounded-2xl border border-[#e3e8f0] bg-white">
                  <div className="divide-y divide-[#f0f4f8]">
                    {items.map(tx => (
                      <div key={tx.id} className="flex items-center gap-3 px-5 py-3.5">
                        {/* Icon */}
                        <div className={`grid size-10 shrink-0 place-items-center rounded-full
                          ${tx.type === 'trade'
                            ? (tx.title.includes('Bought') ? 'bg-[#eaf1ff] text-[#1b5cff]' : 'bg-[#fff4e6] text-[#f97316]')
                            : 'bg-[#f0f4f8] text-[#647084]'}`}>
                          {tx.type === 'trade'
                            ? (tx.title.includes('Bought') ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />)
                            : <Send size={16} />}
                        </div>
                        {/* Text */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#172033]">{tx.title}</p>
                          <p className="text-xs text-[#9ca3af]">
                            {new Date(tx.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            {tx.note ? ` · ${tx.note}` : ''}
                          </p>
                        </div>
                        {/* Amount */}
                        <div className="text-right">
                          <p className={`text-sm font-bold
                            ${tx.amount.startsWith('+') ? 'text-green-600' : 'text-[#172033]'}`}>
                            {tx.amount}
                          </p>
                          {tx.usdValue > 0 && (
                            <p className="text-xs text-[#9ca3af]">${tx.usdValue.toFixed(2)}</p>
                          )}
                        </div>
                        {/* Status */}
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold
                          ${tx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {tx.status === 'completed' ? <><Check size={10} className="inline" /> Done</> : <><Clock size={10} className="inline" /> Pending</>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import ServicePage from '@/components/ServicePage'

const PROVIDERS = ['City Power Grid', 'Sunstate Energy', 'Metro Electric Co.', 'Green Volt']

export default function ElectricityPage() {
  const [provider, setProvider] = useState(PROVIDERS[0])
  const [accountNo, setAccountNo] = useState('')
  const [amount, setAmount]       = useState('')
  const [status, setStatus]       = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage]     = useState('')

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!accountNo.trim() || !amount) return
    setStatus('loading')
    // Simulate async payment (replace with real API call)
    await new Promise(r => setTimeout(r, 1200))
    setStatus('success')
    setMessage(`Payment of $${Number(amount).toFixed(2)} to ${provider} (account ${accountNo}) was successful.`)
    setAccountNo('')
    setAmount('')
  }

  return (
    <ServicePage
      title="Electricity"
      subtitle="Pay your electricity bill instantly using your USD wallet."
      icon={<Zap size={28} />}
    >
      <div className="rounded-2xl border border-[#e3e8f0] bg-white p-6">
        {status === 'success' ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-[#d1fae5] text-green-600">
              <Zap size={28} />
            </div>
            <p className="font-semibold text-green-700">{message}</p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-2 rounded-lg bg-[#1b5cff] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1549d1]"
            >
              Make another payment
            </button>
          </div>
        ) : (
          <form onSubmit={handlePay} className="flex flex-col gap-5">
            <label className="text-sm font-medium text-[#506078]">
              Provider
              <select
                value={provider}
                onChange={e => setProvider(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#dfe5ee] px-4 py-3 text-sm outline-none focus:border-[#1b5cff]"
              >
                {PROVIDERS.map(p => <option key={p}>{p}</option>)}
              </select>
            </label>

            <label className="text-sm font-medium text-[#506078]">
              Account / meter number
              <input
                required
                value={accountNo}
                onChange={e => setAccountNo(e.target.value)}
                placeholder="e.g. 45219873"
                className="mt-1 w-full rounded-lg border border-[#dfe5ee] px-4 py-3 text-sm outline-none focus:border-[#1b5cff]"
              />
            </label>

            <label className="text-sm font-medium text-[#506078]">
              Amount (USD)
              <input
                required
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1 w-full rounded-lg border border-[#dfe5ee] px-4 py-3 text-sm outline-none focus:border-[#1b5cff]"
              />
            </label>

            {status === 'error' && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full rounded-lg bg-[#1b5cff] py-3 text-sm font-semibold text-white hover:bg-[#1549d1] disabled:opacity-60"
            >
              {status === 'loading' ? 'Processing…' : 'Pay bill'}
            </button>
          </form>
        )}
      </div>

      {/* Info box */}
      <div className="mt-5 rounded-xl bg-[#f0f4ff] px-5 py-4 text-sm text-[#3d5a9e]">
        <b>How it works:</b> Enter your provider and meter number, confirm the amount, and we&apos;ll debit your USD wallet instantly. Payments are reflected on your provider&apos;s system within minutes.
      </div>
    </ServicePage>
  )
}

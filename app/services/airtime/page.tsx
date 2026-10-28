'use client'

import { useState } from 'react'
import { Phone } from 'lucide-react'
import ServicePage from '@/components/ServicePage'

const NETWORKS = ['AT&T', 'Verizon', 'T-Mobile', 'Cricket', 'Boost Mobile']
const QUICK_AMOUNTS = ['5', '10', '20', '50']

export default function AirtimePage() {
  const [network, setNetwork]   = useState(NETWORKS[0])
  const [phone, setPhone]       = useState('')
  const [amount, setAmount]     = useState('')
  const [status, setStatus]     = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage]   = useState('')

  async function handleTopUp(e: React.FormEvent) {
    e.preventDefault()
    if (!phone.trim() || !amount) return
    setStatus('loading')
    await new Promise(r => setTimeout(r, 1000))
    setStatus('success')
    setMessage(`$${Number(amount).toFixed(2)} airtime sent to ${phone} on ${network}.`)
    setPhone('')
    setAmount('')
  }

  return (
    <ServicePage
      title="Airtime top-up"
      subtitle="Recharge any phone number instantly from your USD wallet."
      icon={<Phone size={28} />}
    >
      <div className="rounded-2xl border border-[#e3e8f0] bg-white p-6">
        {status === 'success' ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-[#d1fae5] text-green-600">
              <Phone size={28} />
            </div>
            <p className="font-semibold text-green-700">{message}</p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-2 rounded-lg bg-[#1b5cff] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1549d1]"
            >
              Top up another number
            </button>
          </div>
        ) : (
          <form onSubmit={handleTopUp} className="flex flex-col gap-5">
            <label className="text-sm font-medium text-[#506078]">
              Network
              <select
                value={network}
                onChange={e => setNetwork(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#dfe5ee] px-4 py-3 text-sm outline-none focus:border-[#1b5cff]"
              >
                {NETWORKS.map(n => <option key={n}>{n}</option>)}
              </select>
            </label>

            <label className="text-sm font-medium text-[#506078]">
              Phone number
              <input
                required
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="mt-1 w-full rounded-lg border border-[#dfe5ee] px-4 py-3 text-sm outline-none focus:border-[#1b5cff]"
              />
            </label>

            <div>
              <p className="mb-2 text-sm font-medium text-[#506078]">Amount (USD)</p>
              <div className="mb-2 flex gap-2">
                {QUICK_AMOUNTS.map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAmount(a)}
                    className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition ${
                      amount === a
                        ? 'border-[#1b5cff] bg-[#eef3ff] text-[#1b5cff]'
                        : 'border-[#dfe5ee] text-[#506078] hover:border-[#1b5cff]'
                    }`}
                  >
                    ${a}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Or enter custom amount"
                className="w-full rounded-lg border border-[#dfe5ee] px-4 py-3 text-sm outline-none focus:border-[#1b5cff]"
              />
            </div>

            {status === 'error' && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>
            )}

            <button
              type="submit"
              disabled={status === 'loading' || !amount}
              className="w-full rounded-lg bg-[#1b5cff] py-3 text-sm font-semibold text-white hover:bg-[#1549d1] disabled:opacity-60"
            >
              {status === 'loading' ? 'Sending…' : 'Send airtime'}
            </button>
          </form>
        )}
      </div>

      <div className="mt-5 rounded-xl bg-[#f0f4ff] px-5 py-4 text-sm text-[#3d5a9e]">
        <b>Instant delivery:</b> Airtime is credited to the recipient&apos;s number within seconds. Charges are deducted from your USD wallet balance.
      </div>
    </ServicePage>
  )
}

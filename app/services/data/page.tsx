'use client'

import { useState } from 'react'
import { Wifi } from 'lucide-react'
import ServicePage from '@/components/ServicePage'

const NETWORKS = ['AT&T', 'Verizon', 'T-Mobile', 'Cricket', 'Boost Mobile']

const PLANS = [
  { id: 'p1', label: '1 GB',  duration: '7 days',  price: 3 },
  { id: 'p2', label: '3 GB',  duration: '30 days', price: 8 },
  { id: 'p3', label: '5 GB',  duration: '30 days', price: 12 },
  { id: 'p4', label: '10 GB', duration: '30 days', price: 20 },
  { id: 'p5', label: 'Unlimited', duration: '30 days', price: 35 },
]

export default function DataPage() {
  const [network, setNetwork]   = useState(NETWORKS[0])
  const [phone, setPhone]       = useState('')
  const [planId, setPlanId]     = useState(PLANS[1].id)
  const [status, setStatus]     = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage]   = useState('')

  const selectedPlan = PLANS.find(p => p.id === planId)!

  async function handleBuy(e: React.FormEvent) {
    e.preventDefault()
    if (!phone.trim()) return
    setStatus('loading')
    await new Promise(r => setTimeout(r, 1100))
    setStatus('success')
    setMessage(`${selectedPlan.label} data plan activated on ${phone} (${network}) for ${selectedPlan.duration}.`)
    setPhone('')
  }

  return (
    <ServicePage
      title="Mobile data"
      subtitle="Buy a data bundle for any number on your preferred network."
      icon={<Wifi size={28} />}
    >
      <div className="rounded-2xl border border-[#e3e8f0] bg-white p-6">
        {status === 'success' ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-[#d1fae5] text-green-600">
              <Wifi size={28} />
            </div>
            <p className="font-semibold text-green-700">{message}</p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-2 rounded-lg bg-[#1b5cff] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1549d1]"
            >
              Buy another bundle
            </button>
          </div>
        ) : (
          <form onSubmit={handleBuy} className="flex flex-col gap-5">
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
              <p className="mb-2 text-sm font-medium text-[#506078]">Select a plan</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {PLANS.map(plan => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setPlanId(plan.id)}
                    className={`rounded-xl border p-4 text-left transition ${
                      planId === plan.id
                        ? 'border-[#1b5cff] bg-[#eef3ff]'
                        : 'border-[#e3e8f0] hover:border-[#1b5cff]'
                    }`}
                  >
                    <b className="block text-sm text-[#172033]">{plan.label}</b>
                    <span className="text-xs text-[#73809a]">{plan.duration}</span>
                    <p className="mt-2 text-base font-bold text-[#1b5cff]">${plan.price}</p>
                  </button>
                ))}
              </div>
            </div>

            {status === 'error' && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full rounded-lg bg-[#1b5cff] py-3 text-sm font-semibold text-white hover:bg-[#1549d1] disabled:opacity-60"
            >
              {status === 'loading' ? 'Activating…' : `Buy ${selectedPlan.label} for $${selectedPlan.price}`}
            </button>
          </form>
        )}
      </div>

      <div className="mt-5 rounded-xl bg-[#f0f4ff] px-5 py-4 text-sm text-[#3d5a9e]">
        <b>Activation:</b> Data bundles are activated within a few seconds. Cost is deducted from your USD wallet.
      </div>
    </ServicePage>
  )
}

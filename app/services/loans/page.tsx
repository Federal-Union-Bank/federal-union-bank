'use client'

import { useState, useMemo } from 'react'
import { Wallet } from 'lucide-react'
import ServicePage from '@/components/ServicePage'

const ANNUAL_RATE = 0.089  // 8.9 % APR (illustrative)
const TERMS = [6, 12, 24, 36]

export default function LoansPage() {
  const [principal, setPrincipal] = useState('5000')
  const [termMonths, setTermMonths] = useState(12)
  const [applied, setApplied]    = useState(false)
  const [loading, setLoading]    = useState(false)

  // Monthly payment calculation (standard amortisation formula)
  const monthly = useMemo(() => {
    const p = Number(principal)
    if (!p || p <= 0) return 0
    const r = ANNUAL_RATE / 12
    const n = termMonths
    return (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  }, [principal, termMonths])

  const totalRepay = monthly * termMonths
  const totalInterest = totalRepay - Number(principal)

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 1400))
    setLoading(false)
    setApplied(true)
  }

  return (
    <ServicePage
      title="Personal loans"
      subtitle="Get a clear picture of your repayments before you apply."
      icon={<Wallet size={28} />}
    >
      {applied ? (
        <div className="rounded-2xl border border-[#e3e8f0] bg-white p-8 text-center">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-[#d1fae5] text-green-600">
            <Wallet size={30} />
          </div>
          <h2 className="text-xl font-bold text-[#172033]">Application received</h2>
          <p className="mt-2 text-sm text-[#73809a]">
            We&apos;ll review your loan request of <strong>${Number(principal).toLocaleString()}</strong> over{' '}
            <strong>{termMonths} months</strong> and get back to you within one business day.
          </p>
          <button
            onClick={() => setApplied(false)}
            className="mt-6 rounded-lg border border-[#1b5cff] px-5 py-2.5 text-sm font-semibold text-[#1b5cff] hover:bg-[#f1f5ff]"
          >
            Start a new application
          </button>
        </div>
      ) : (
        <form onSubmit={handleApply} className="flex flex-col gap-5">
          {/* Calculator card */}
          <div className="rounded-2xl border border-[#e3e8f0] bg-white p-6">
            <h2 className="mb-4 font-bold">Loan calculator</h2>

            <label className="text-sm font-medium text-[#506078]">
              Loan amount (USD)
              <input
                required
                type="number"
                min="500"
                max="50000"
                step="100"
                value={principal}
                onChange={e => setPrincipal(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#dfe5ee] px-4 py-3 text-lg font-semibold outline-none focus:border-[#1b5cff]"
              />
            </label>

            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-[#506078]">Repayment term</p>
              <div className="flex gap-2">
                {TERMS.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTermMonths(t)}
                    className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition ${
                      termMonths === t
                        ? 'border-[#1b5cff] bg-[#eef3ff] text-[#1b5cff]'
                        : 'border-[#dfe5ee] text-[#506078] hover:border-[#1b5cff]'
                    }`}
                  >
                    {t}mo
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6 grid grid-cols-3 divide-x divide-[#e3e8f0] rounded-xl bg-[#f7f9fc] text-center">
              <div className="px-4 py-4">
                <p className="text-xs text-[#73809a]">Monthly payment</p>
                <p className="mt-1 text-lg font-bold text-[#1b5cff]">
                  ${monthly.toFixed(2)}
                </p>
              </div>
              <div className="px-4 py-4">
                <p className="text-xs text-[#73809a]">Total repayable</p>
                <p className="mt-1 text-lg font-bold">${totalRepay.toFixed(2)}</p>
              </div>
              <div className="px-4 py-4">
                <p className="text-xs text-[#73809a]">Total interest</p>
                <p className="mt-1 text-lg font-bold">${Math.max(0, totalInterest).toFixed(2)}</p>
              </div>
            </div>

            <p className="mt-3 text-center text-xs text-[#8a96a8]">
              Representative {(ANNUAL_RATE * 100).toFixed(1)}% APR. Subject to credit approval. For illustrative purposes only.
            </p>
          </div>

          {/* Personal details */}
          <div className="rounded-2xl border border-[#e3e8f0] bg-white p-6">
            <h2 className="mb-4 font-bold">Your details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-[#506078]">
                Full name
                <input required placeholder="Jordan Smith" className="mt-1 w-full rounded-lg border border-[#dfe5ee] px-4 py-3 text-sm outline-none focus:border-[#1b5cff]" />
              </label>
              <label className="text-sm font-medium text-[#506078]">
                Email address
                <input required type="email" placeholder="you@example.com" className="mt-1 w-full rounded-lg border border-[#dfe5ee] px-4 py-3 text-sm outline-none focus:border-[#1b5cff]" />
              </label>
              <label className="text-sm font-medium text-[#506078]">
                Annual income (USD)
                <input required type="number" min="0" placeholder="60000" className="mt-1 w-full rounded-lg border border-[#dfe5ee] px-4 py-3 text-sm outline-none focus:border-[#1b5cff]" />
              </label>
              <label className="text-sm font-medium text-[#506078]">
                Employment status
                <select className="mt-1 w-full rounded-lg border border-[#dfe5ee] px-4 py-3 text-sm outline-none focus:border-[#1b5cff]">
                  <option>Full-time employed</option>
                  <option>Part-time employed</option>
                  <option>Self-employed</option>
                  <option>Student</option>
                  <option>Retired</option>
                  <option>Other</option>
                </select>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#1b5cff] py-3 text-sm font-semibold text-white hover:bg-[#1549d1] disabled:opacity-60"
          >
            {loading ? 'Submitting application…' : 'Apply now'}
          </button>
        </form>
      )}
    </ServicePage>
  )
}

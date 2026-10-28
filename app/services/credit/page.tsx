'use client'

import { useState } from 'react'
import { Droplets, TrendingUp, ShieldCheck, Star } from 'lucide-react'
import ServicePage from '@/components/ServicePage'

const SCORE = 712  // Demo score

const SCORE_RANGES = [
  { label: 'Poor',      min: 300, max: 579, color: '#ef4444' },
  { label: 'Fair',      min: 580, max: 669, color: '#f97316' },
  { label: 'Good',      min: 670, max: 739, color: '#eab308' },
  { label: 'Very good', min: 740, max: 799, color: '#22c55e' },
  { label: 'Excellent', min: 800, max: 850, color: '#1b5cff' },
]

function getRange(score: number) {
  return SCORE_RANGES.find(r => score >= r.min && score <= r.max) ?? SCORE_RANGES[0]
}

const TIPS = [
  { icon: <ShieldCheck size={18} />, title: 'Pay on time', body: 'Payment history is the biggest factor. Set up auto-pay to never miss a due date.' },
  { icon: <TrendingUp size={18} />, title: 'Lower your utilisation', body: 'Try to use less than 30% of your available credit limit across all cards.' },
  { icon: <Star size={18} />, title: 'Keep old accounts open', body: 'Length of credit history matters. Avoid closing your oldest card unless there\'s a compelling reason.' },
  { icon: <Droplets size={18} />, title: 'Limit hard inquiries', body: 'Each credit application creates a hard inquiry. Space them out by at least 6 months.' },
]

export default function CreditPage() {
  const [requested, setRequested] = useState(false)
  const [loading, setLoading]     = useState(false)
  const range = getRange(SCORE)

  // Percentage position on the 300-850 range for the indicator
  const pct = ((SCORE - 300) / (850 - 300)) * 100

  async function handleRequest() {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    setLoading(false)
    setRequested(true)
  }

  return (
    <ServicePage
      title="Credit score"
      subtitle="Understand your score and get personalised tips to improve it."
      icon={<Droplets size={28} />}
    >
      {/* Score card */}
      <div className="rounded-2xl border border-[#e3e8f0] bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#73809a]">Your credit score</p>
            <p className="mt-1 text-5xl font-bold tracking-tight" style={{ color: range.color }}>
              {SCORE}
            </p>
            <span
              className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: range.color }}
            >
              {range.label}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="mb-1 text-xs text-[#73809a]">Score range</p>
            <p className="text-sm font-semibold text-[#172033]">300 – 850</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative mt-6 h-3 overflow-hidden rounded-full bg-gradient-to-r from-[#ef4444] via-[#eab308] to-[#1b5cff]">
          <div
            className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#172033] shadow"
            style={{ left: `${pct}%` }}
            aria-label={`Score indicator at ${pct.toFixed(0)}%`}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-[#73809a]">
          <span>300</span><span>850</span>
        </div>

        <p className="mt-4 text-xs text-[#8a96a8]">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. Scores are for illustrative purposes.
        </p>
      </div>

      {/* Score breakdown */}
      <div className="mt-5 rounded-2xl border border-[#e3e8f0] bg-white p-6">
        <h2 className="mb-4 font-bold">Score breakdown</h2>
        <div className="flex flex-col gap-3">
          {[
            { label: 'Payment history',        pct: 88, weight: '35%' },
            { label: 'Amounts owed',            pct: 72, weight: '30%' },
            { label: 'Length of history',       pct: 65, weight: '15%' },
            { label: 'New credit',              pct: 90, weight: '10%' },
            { label: 'Credit mix',              pct: 78, weight: '10%' },
          ].map(item => (
            <div key={item.label}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium text-[#172033]">{item.label}</span>
                <span className="text-[#73809a]">{item.weight}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#e8edf5]">
                <div
                  className="h-full rounded-full bg-[#1b5cff]"
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="mt-5 rounded-2xl border border-[#e3e8f0] bg-white p-6">
        <h2 className="mb-4 font-bold">How to improve your score</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {TIPS.map(tip => (
            <div key={tip.title} className="rounded-xl bg-[#f5f8ff] p-4">
              <div className="mb-2 flex items-center gap-2 text-[#1b5cff]">{tip.icon}<b className="text-sm text-[#172033]">{tip.title}</b></div>
              <p className="text-xs text-[#73809a]">{tip.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-5 rounded-2xl border border-[#e3e8f0] bg-white p-6 text-center">
        <h2 className="font-bold">Want a full credit report?</h2>
        <p className="mt-1 text-sm text-[#73809a]">Request a detailed breakdown — we&apos;ll email it to you within one business day.</p>
        {requested ? (
          <p className="mt-4 font-semibold text-green-600">Request received! Check your email shortly.</p>
        ) : (
          <button
            onClick={handleRequest}
            disabled={loading}
            className="mt-4 rounded-lg bg-[#1b5cff] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1549d1] disabled:opacity-60"
          >
            {loading ? 'Requesting…' : 'Request full report'}
          </button>
        )}
      </div>
    </ServicePage>
  )
}

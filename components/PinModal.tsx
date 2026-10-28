'use client'

import { useState, useRef, useEffect } from 'react'
import { ShieldCheck, X } from 'lucide-react'

interface PinModalProps {
  open: boolean
  title?: string
  subtitle?: string
  onClose: () => void
  onSuccess: () => void
}

/**
 * Modal that asks the user for their 4-digit transaction PIN.
 * Calls /api/pin/verify to check it. Calls onSuccess() when verified.
 */
export default function PinModal({
  open,
  title = 'Enter your PIN',
  subtitle = 'Confirm your 4-digit transaction PIN to continue.',
  onClose,
  onSuccess,
}: PinModalProps) {
  const [digits, setDigits] = useState(['', '', '', ''])
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  // Reset state whenever the modal opens
  useEffect(() => {
    if (open) {
      setDigits(['', '', '', ''])
      setError('')
      setLoading(false)
      setTimeout(() => refs.current[0]?.focus(), 100)
    }
  }, [open])

  // Auto-verify when all 4 digits are entered
  useEffect(() => {
    if (digits.every(d => d) && digits.join('').length === 4) {
      verifyPin()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits])

  function handleChange(i: number, val: string) {
    if (!/^\d?$/.test(val)) return
    const next = [...digits]
    next[i] = val
    setDigits(next)
    if (val && i < 3) refs.current[i + 1]?.focus()
  }

  function handleKey(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
  }

  async function verifyPin() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: digits.join('') }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Incorrect PIN.')
        setDigits(['', '', '', ''])
        setTimeout(() => refs.current[0]?.focus(), 100)
        return
      }
      onSuccess()
    } catch {
      setError('Something went wrong. Please try again.')
      setDigits(['', '', '', ''])
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-2xl border border-[#e3e8f0] bg-white p-7 shadow-xl">
        {/* Close */}
        <button onClick={onClose} aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-[#9ca3af] hover:bg-[#f1f4f8] hover:text-[#506078]">
          <X size={18} />
        </button>

        {/* Icon */}
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-[#eef3ff] text-[#1b5cff]">
          <ShieldCheck size={26} />
        </div>

        <h2 className="text-center text-lg font-bold tracking-tight text-[#172033]">{title}</h2>
        <p className="mt-1 text-center text-sm text-[#73809a]">{subtitle}</p>

        {/* PIN dots */}
        <div className="mt-6 flex justify-center gap-3">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { refs.current[i] = el }}
              value={d}
              type="password"
              inputMode="numeric"
              maxLength={1}
              disabled={loading}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
              className="size-14 rounded-xl border border-[#dfe5ee] text-center text-2xl font-bold text-[#172033] outline-none transition focus:border-[#1b5cff] focus:ring-2 focus:ring-[#1b5cff]/20 disabled:opacity-50"
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="mt-4 text-center text-sm font-medium text-red-600">{error}</p>
        )}

        {/* Loading */}
        {loading && !error && (
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-[#73809a]">
            <span className="size-4 animate-spin rounded-full border-2 border-[#dfe5ee] border-t-[#1b5cff]" />
            Verifying…
          </p>
        )}

        <p className="mt-5 text-center text-xs text-[#b0b8c8]">
          This PIN was set during registration. You can change it in Settings.
        </p>
      </div>
    </div>
  )
}

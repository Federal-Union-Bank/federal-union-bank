'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'
import {
  ArrowLeft, Bell, ChevronRight, CreditCard, Eye, EyeOff,
  Globe, KeyRound, LogOut, Moon, Settings, ShieldCheck,
  Smartphone, Sun, Trash2, User, Wallet,
} from 'lucide-react'
import { signOut, useSession } from '@/lib/auth-client'

// ── tiny helpers ────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#e3e8f0] bg-white">
      <h2 className="border-b border-[#e3e8f0] px-6 py-4 text-xs font-semibold uppercase tracking-widest text-[#9ca3af]">
        {title}
      </h2>
      <div className="divide-y divide-[#f0f4f8]">{children}</div>
    </section>
  )
}

function Row({
  icon,
  label,
  subtitle,
  right,
  danger,
  onClick,
  href,
}: {
  icon: React.ReactNode
  label: string
  subtitle?: string
  right?: React.ReactNode
  danger?: boolean
  onClick?: () => void
  href?: string
}) {
  const inner = (
    <div
      className={`flex items-center gap-4 px-6 py-4 transition
        ${onClick || href ? 'cursor-pointer hover:bg-[#f8fafc]' : ''}
        ${danger ? 'hover:bg-red-50' : ''}`}
      onClick={onClick}
    >
      <div className={`grid size-9 shrink-0 place-items-center rounded-xl
        ${danger ? 'bg-red-50 text-red-500' : 'bg-[#eef3ff] text-[#1b5cff]'}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${danger ? 'text-red-600' : 'text-[#172033]'}`}>{label}</p>
        {subtitle && <p className="mt-0.5 text-xs text-[#9ca3af]">{subtitle}</p>}
      </div>
      <div className="shrink-0 text-sm text-[#73809a]">{right ?? (onClick || href ? <ChevronRight size={16} className="text-[#c8d0dc]" /> : null)}</div>
    </div>
  )
  if (href) return <Link href={href}>{inner}</Link>
  return inner
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors
        ${checked ? 'bg-[#1b5cff]' : 'bg-[#d1d5db]'}`}
    >
      <span className={`inline-block size-3.5 rounded-full bg-white shadow transition-transform
        ${checked ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
    </button>
  )
}

// ── page ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  // form state
  const [name, setName]           = useState('')
  const [email, setEmail]         = useState('')
  const [editProfile, setEdit]    = useState(false)
  const [saving, setSaving]       = useState(false)
  const [savedMsg, setSavedMsg]   = useState('')

  // preferences
  const [theme, setTheme]             = useState<'light' | 'dark' | 'system'>('system')
  const [currency, setCurrency]       = useState('USD')
  const [hideBalance, setHideBalance] = useState(false)

  // notifications
  const [notifTrade,    setNotifTrade]    = useState(true)
  const [notifTransfer, setNotifTransfer] = useState(true)
  const [notifPromo,    setNotifPromo]    = useState(false)
  const [notifSecurity, setNotifSecurity] = useState(true)

  // sign-out confirm
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [loggingOut, setLoggingOut]       = useState(false)

  useEffect(() => {
    if (!isPending && !session) router.push('/login?next=/settings')
  }, [session, isPending, router])

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name ?? '')
      setEmail(session.user.email ?? '')
    }
  }, [session])

  // Auto-expand sign-out confirm if navigated to with #signout
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#signout') {
      setConfirmLogout(true)
      setTimeout(() => {
        document.getElementById('signout-section')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    setEdit(false)
    setSavedMsg('Profile updated successfully.')
    setTimeout(() => setSavedMsg(''), 3000)
  }

  async function handleSignOut() {
    setLoggingOut(true)
    await signOut()
    router.push('/login')
  }

  const userName = session?.user?.name ?? ''
  const userEmail = session?.user?.email ?? ''
  const initials = userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'

  if (isPending || !session) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc] text-[#73809a]">Loading…</div>
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#172033]">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="flex h-16 items-center justify-between border-b border-[#e7ebf2] bg-white px-6 sm:px-8">
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-auto" />
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg border border-[#e0e6ef] bg-white px-3 py-2 text-sm font-medium text-[#506078] hover:bg-slate-50"
        >
          <ArrowLeft size={15} />
          Dashboard
        </Link>
      </header>

      <div className="mx-auto max-w-[720px] px-4 py-8 sm:px-6">

        {/* Page title */}
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-[#eef3ff] text-[#1b5cff]">
            <Settings size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-[#73809a]">Manage your account and preferences.</p>
          </div>
        </div>

        {savedMsg && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {savedMsg}
          </div>
        )}

        <div className="flex flex-col gap-5">

          {/* ── Profile ──────────────────────────────────────────── */}
          <Section title="Profile">
            {/* Avatar row */}
            <div className="flex items-center gap-4 px-6 py-5">
              <div className="grid size-14 place-items-center rounded-full bg-[#dfe8ff] text-xl font-bold text-[#1b5cff]">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#172033] truncate">{userName}</p>
                <p className="text-sm text-[#73809a] truncate">{userEmail}</p>
              </div>
              <button
                onClick={() => setEdit(v => !v)}
                className="shrink-0 rounded-lg border border-[#e0e6ef] px-3 py-1.5 text-xs font-semibold text-[#506078] hover:bg-slate-50"
              >
                {editProfile ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {/* Inline edit form */}
            {editProfile && (
              <form onSubmit={handleSave} className="border-t border-[#f0f4f8] px-6 py-5">
                <div className="flex flex-col gap-4">
                  <label className="text-sm font-medium text-[#374151]">
                    Full name
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-[#dfe5ee] px-4 py-2.5 text-sm outline-none focus:border-[#1b5cff] focus:ring-2 focus:ring-[#1b5cff]/20"
                    />
                  </label>
                  <label className="text-sm font-medium text-[#374151]">
                    Email address
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-[#dfe5ee] px-4 py-2.5 text-sm outline-none focus:border-[#1b5cff] focus:ring-2 focus:ring-[#1b5cff]/20"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full rounded-xl bg-[#1b5cff] py-2.5 text-sm font-semibold text-white hover:bg-[#1549d1] disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </form>
            )}
          </Section>

          {/* ── Security ─────────────────────────────────────────── */}
          <Section title="Security">
            <Row
              icon={<KeyRound size={17} />}
              label="Change password"
              subtitle="Update your login password"
            />
            <Row
              icon={<Smartphone size={17} />}
              label="Two-factor authentication"
              subtitle="Not enabled"
              right={
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  Off
                </span>
              }
            />
            <Row
              icon={<Globe size={17} />}
              label="Active sessions"
              subtitle="View and revoke other sessions"
            />
          </Section>

          {/* ── Wallet ───────────────────────────────────────────── */}
          <Section title="Wallet & payments">
            <Row
              icon={<Wallet size={17} />}
              label="USDC wallet address"
              subtitle="View your deposit address"
              href="/usdc"
            />
            <Row
              icon={<CreditCard size={17} />}
              label="Account number"
              subtitle="Your Federal Union Bank account ID"
              href="/dashboard"
            />
            <Row
              icon={<EyeOff size={17} />}
              label="Hide balances by default"
              subtitle="Balances will be masked on load"
              right={<Toggle checked={hideBalance} onChange={setHideBalance} />}
              onClick={() => setHideBalance(v => !v)}
            />
          </Section>

          {/* ── Notifications ────────────────────────────────────── */}
          <Section title="Notifications">
            <Row
              icon={<Bell size={17} />}
              label="Trade confirmations"
              subtitle="Email when a buy or sell completes"
              right={<Toggle checked={notifTrade} onChange={setNotifTrade} />}
              onClick={() => setNotifTrade(v => !v)}
            />
            <Row
              icon={<Bell size={17} />}
              label="Transfer alerts"
              subtitle="Email when USDC is sent or received"
              right={<Toggle checked={notifTransfer} onChange={setNotifTransfer} />}
              onClick={() => setNotifTransfer(v => !v)}
            />
            <Row
              icon={<ShieldCheck size={17} />}
              label="Security alerts"
              subtitle="New login or password change"
              right={<Toggle checked={notifSecurity} onChange={setNotifSecurity} />}
              onClick={() => setNotifSecurity(v => !v)}
            />
            <Row
              icon={<Bell size={17} />}
              label="Promotions & news"
              subtitle="Product updates and offers"
              right={<Toggle checked={notifPromo} onChange={setNotifPromo} />}
              onClick={() => setNotifPromo(v => !v)}
            />
          </Section>

          {/* ── Preferences ──────────────────────────────────────── */}
          <Section title="Preferences">
            {/* Theme picker */}
            <div className="flex items-center gap-4 px-6 py-4">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#eef3ff] text-[#1b5cff]">
                {theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#172033]">Theme</p>
                <p className="text-xs text-[#9ca3af]">Choose your display preference</p>
              </div>
              <div className="flex rounded-lg border border-[#e3e8f0] bg-[#f7f9fc] p-0.5 text-xs font-semibold">
                {(['light', 'system', 'dark'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`rounded-md px-3 py-1.5 capitalize transition
                      ${theme === t ? 'bg-white text-[#1b5cff] shadow-sm' : 'text-[#73809a] hover:text-[#172033]'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Currency */}
            <div className="flex items-center gap-4 px-6 py-4">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#eef3ff] text-[#1b5cff]">
                <Globe size={17} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#172033]">Display currency</p>
                <p className="text-xs text-[#9ca3af]">Fiat currency for balance display</p>
              </div>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="rounded-lg border border-[#dfe5ee] bg-white px-3 py-1.5 text-sm text-[#172033] outline-none focus:border-[#1b5cff]"
              >
                {['USD', 'EUR', 'GBP'].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </Section>

          {/* ── Danger zone ──────────────────────────────────────── */}
          <Section title="Account">
            <Row
              icon={<Trash2 size={17} />}
              label="Close account"
              subtitle="Permanently delete your account and data"
              danger
            />

            {/* Sign out */}
            <div id="signout-section">
            {!confirmLogout ? (
              <Row
                icon={<LogOut size={17} />}
                label="Sign out"
                subtitle="Sign out of this device"
                danger
                onClick={() => setConfirmLogout(true)}
              />
            ) : (
              <div className="flex items-center gap-3 bg-red-50 px-6 py-4">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-red-100 text-red-500">
                  <LogOut size={17} />
                </div>
                <p className="flex-1 text-sm font-medium text-red-700">Sure you want to sign out?</p>
                <button
                  onClick={() => setConfirmLogout(false)}
                  className="rounded-lg border border-[#e0e6ef] bg-white px-3 py-1.5 text-xs font-semibold text-[#506078] hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSignOut}
                  disabled={loggingOut}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {loggingOut ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            )}
            </div>
          </Section>

          {/* Footer */}
          <p className="pb-4 text-center text-xs text-[#b0b8c8]">
            Federal Union Bank · Demo app · v0.1.0
          </p>
        </div>
      </div>
    </main>
  )
}

'use client'

import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { type ReactNode } from 'react'

interface Props {
  title: string
  subtitle: string
  icon: ReactNode
  children: ReactNode
}

export default function ServicePage({ title, subtitle, icon, children }: Props) {
  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#172033]">
      {/* Header */}
      <header className="flex h-20 items-center justify-between border-b border-[#e7ebf2] bg-white px-8">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-[#1b5cff] text-white">
            <ShieldCheck />
          </div>
          <span className="text-xl font-bold tracking-tight">Federal Union Bank</span>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg border border-[#e0e6ef] bg-white px-4 py-2 text-sm font-semibold text-[#506078] hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>
      </header>

      <div className="mx-auto max-w-[720px] px-6 py-10">
        {/* Page hero */}
        <div className="mb-8 flex items-center gap-4">
          <div className="grid size-14 place-items-center rounded-2xl bg-[#dfe8ff] text-[#1b5cff]">
            {icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-[#73809a]">{subtitle}</p>
          </div>
        </div>

        {children}
      </div>
    </main>
  )
}

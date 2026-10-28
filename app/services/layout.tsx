import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Services | Federal Union Bank',
}

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

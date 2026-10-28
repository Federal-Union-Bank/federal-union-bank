import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export default async function HomePage() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (session) redirect('/dashboard')
  } catch {
    // auth not configured yet — fall through to login
  }
  redirect('/login')
}

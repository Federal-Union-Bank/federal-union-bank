import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

// Force Node.js runtime — pg and drizzle-orm need Node, not Edge
export const runtime = 'nodejs'
export const maxDuration = 30

export const { GET, POST } = toNextJsHandler(auth)

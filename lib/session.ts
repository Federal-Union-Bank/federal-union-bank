import { auth } from '@/lib/auth'

const DEMO_USER = 'demo-user'

/**
 * Resolves the authenticated user ID from an incoming API request.
 *
 * The middleware forwards the session cookie value as `x-session-token`.
 * We pass it back as a Cookie header so better-auth can verify it server-side
 * (Node.js route handler — no Edge runtime restrictions here).
 *
 * Falls back to DEMO_USER when no token is present (dev convenience).
 */
export async function getUserId(request: Request): Promise<string> {
  const token = request.headers.get('x-session-token')
  if (!token) return DEMO_USER

  try {
    const session = await auth.api.getSession({
      headers: new Headers({ cookie: `better-auth.session_token=${token}` }),
    })
    return session?.user?.id ?? DEMO_USER
  } catch {
    return DEMO_USER
  }
}

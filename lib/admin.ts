import { auth } from '@/lib/auth'

const DEMO_USER = 'demo-user'

/**
 * Resolves the authenticated user and returns their ID + admin status.
 * Returns null if not authenticated (for admin routes this means 401).
 */
export async function getAdminUser(request: Request) {
  const token = request.headers.get('x-session-token')
  if (!token) return null

  try {
    const session = await auth.api.getSession({
      headers: new Headers({ cookie: `better-auth.session_token=${token}` }),
    })
    if (!session?.user) return null

    // Check is_admin flag from the database
    const { sql } = await import('drizzle-orm')
    const { db } = await import('@/lib/db')
    const result = await db.execute(
      sql`SELECT is_admin FROM users WHERE id = ${session.user.id}`,
    )
    const row = result.rows[0] as { is_admin: boolean } | undefined

    if (row?.is_admin) {
      return { id: session.user.id, name: session.user.name, email: session.user.email }
    }
    return null
  } catch {
    return null
  }
}

/** Same as getUserId from session.ts but also returns admin status. */
export async function getUserInfo(request: Request) {
  const token = request.headers.get('x-session-token')
  if (!token) return { id: DEMO_USER, isAdmin: false }

  try {
    const session = await auth.api.getSession({
      headers: new Headers({ cookie: `better-auth.session_token=${token}` }),
    })
    if (!session?.user) return { id: DEMO_USER, isAdmin: false }

    const { sql } = await import('drizzle-orm')
    const { db } = await import('@/lib/db')
    const result = await db.execute(
      sql`SELECT is_admin FROM users WHERE id = ${session.user.id}`,
    )
    const row = result.rows[0] as { is_admin: boolean } | undefined

    return {
      id:      session.user.id,
      isAdmin: !!row?.is_admin,
    }
  } catch {
    return { id: DEMO_USER, isAdmin: false }
  }
}

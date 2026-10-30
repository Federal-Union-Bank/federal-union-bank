import { auth } from '@/lib/auth'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@federalunion.com'

/**
 * Gets the current session using the full request headers (works on both
 * HTTP and HTTPS — handles both plain and __Secure- cookie prefixes).
 */
async function getSession(request: Request) {
  try {
    // Pass the full headers so better-auth can find the cookie regardless of prefix
    return await auth.api.getSession({ headers: request.headers })
  } catch {
    return null
  }
}

/**
 * Returns the admin user object if the request is from an admin, else null.
 */
export async function getAdminUser(request: Request) {
  try {
    const session = await getSession(request)
    if (!session?.user) return null

    const email = session.user.email ?? ''

    // Check 1: email match (works without DB column)
    if (email === ADMIN_EMAIL) {
      return { id: session.user.id, name: session.user.name, email }
    }

    // Check 2: is_admin DB column (for additional admins added later)
    try {
      const { sql } = await import('drizzle-orm')
      const { db }  = await import('@/lib/db')
      const result  = await db.execute(sql`SELECT is_admin FROM users WHERE id = ${session.user.id}`)
      const row     = result.rows[0] as { is_admin: boolean } | undefined
      if (row?.is_admin) {
        return { id: session.user.id, name: session.user.name, email }
      }
    } catch { /* column might not exist yet */ }

    return null
  } catch {
    return null
  }
}

/**
 * Returns user ID and admin status for any authenticated request.
 */
export async function getUserInfo(request: Request) {
  try {
    const session = await getSession(request)
    if (!session?.user) return { id: 'demo-user', isAdmin: false }

    const email   = session.user.email ?? ''
    const isAdmin = email === ADMIN_EMAIL

    return { id: session.user.id, isAdmin }
  } catch {
    return { id: 'demo-user', isAdmin: false }
  }
}

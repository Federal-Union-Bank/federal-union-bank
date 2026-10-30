import { auth } from '@/lib/auth'

const DEMO_USER  = 'demo-user'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@federalunion.com'

/**
 * Checks if the requesting user is an admin.
 * First tries the is_admin column; falls back to email match so it works
 * even if the column hasn't been added to the DB yet (e.g. on Vercel before db:push).
 */
async function checkIsAdmin(userId: string, userEmail: string): Promise<boolean> {
  try {
    const { sql } = await import('drizzle-orm')
    const { db }  = await import('@/lib/db')
    const result  = await db.execute(sql`SELECT is_admin FROM users WHERE id = ${userId}`)
    const row     = result.rows[0] as { is_admin: boolean } | undefined
    // is_admin column exists — use it
    if (row !== undefined) return !!row.is_admin
  } catch {
    // Column doesn't exist yet — fall through to email check
  }
  // Fallback: match against the admin email env var
  return userEmail === ADMIN_EMAIL
}

/**
 * Returns the admin user object if the request is from an admin, else null.
 */
export async function getAdminUser(request: Request) {
  const token = request.headers.get('x-session-token')
  if (!token) return null

  try {
    const session = await auth.api.getSession({
      headers: new Headers({ cookie: `better-auth.session_token=${token}` }),
    })
    if (!session?.user) return null

    const isAdmin = await checkIsAdmin(session.user.id, session.user.email ?? '')
    if (!isAdmin) return null

    return { id: session.user.id, name: session.user.name, email: session.user.email }
  } catch {
    return null
  }
}

/**
 * Returns user ID and admin status for any authenticated request.
 */
export async function getUserInfo(request: Request) {
  const token = request.headers.get('x-session-token')
  if (!token) return { id: DEMO_USER, isAdmin: false }

  try {
    const session = await auth.api.getSession({
      headers: new Headers({ cookie: `better-auth.session_token=${token}` }),
    })
    if (!session?.user) return { id: DEMO_USER, isAdmin: false }

    const isAdmin = await checkIsAdmin(session.user.id, session.user.email ?? '')
    return { id: session.user.id, isAdmin }
  } catch {
    return { id: DEMO_USER, isAdmin: false }
  }
}

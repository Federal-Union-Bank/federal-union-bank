/**
 * Creates the admin account with a proper bcrypt password hash.
 * Run after setting up the database:
 *
 *   node scripts/create-admin.mjs
 *
 * Default credentials:
 *   Email:    admin@federalunion.com
 *   Password: Admin@12345
 *
 * Change the password by editing ADMIN_PASSWORD below.
 */
import bcrypt from 'bcryptjs'
import pg from 'pg'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// ── Auto-load .env.local ──────────────────────────────────────────────────
const envPath = resolve(process.cwd(), '.env.local')
if (existsSync(envPath) && !process.env.DATABASE_URL) {
  const content = readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const match = line.match(/^([A-Z_]+)=(.*)$/)
    if (match) {
      const key = match[1]
      const val = match[2].replace(/^["']|["']$/g, '').trim()
      if (!process.env[key]) process.env[key] = val
    }
  }
}

const DATABASE_URL = process.env.DATABASE_URL
const ADMIN_ID    = 'admin-0000-0000-0000-0000-0000-admin'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@federalunion.com'
const ADMIN_NAME  = 'Bank Admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin@12345'

if (!DATABASE_URL) {
  console.error('\n❌  DATABASE_URL is not set.')
  console.error('   Add it to .env.local or export it in your shell.\n')
  process.exit(1)
}

const pool = new pg.Pool({ connectionString: DATABASE_URL })

async function main() {
  console.log('\n🔒  Creating admin account...\n')

  // Make sure is_admin column exists (in case db:push hasn't been run yet)
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE`)
  } catch (e) {
    // Table might not exist at all
    console.error('❌  users table not found. Run "pnpm db:push" first.\n')
    throw e
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)

  // Upsert the user
  await pool.query(`
    INSERT INTO users (id, name, email, email_verified, is_admin)
    VALUES ($1, $2, $3, TRUE, TRUE)
    ON CONFLICT (id) DO UPDATE SET is_admin = TRUE, email_verified = TRUE
  `, [ADMIN_ID, ADMIN_NAME, ADMIN_EMAIL])

  // Upsert the credential account (this holds the password hash)
  await pool.query(`
    INSERT INTO accounts (id, user_id, account_id, provider_id, password)
    VALUES ('admin-acct-0000', $1, 'admin', 'credential', $2)
    ON CONFLICT (id) DO UPDATE SET password = $2
  `, [ADMIN_ID, passwordHash])

  // Verify it worked
  const check = await pool.query('SELECT id, email, is_admin FROM users WHERE email = $1', [ADMIN_EMAIL])
  if (check.rows.length === 0) {
    console.error('❌  Something went wrong — admin user was not created.\n')
    process.exit(1)
  }

  const acctCheck = await pool.query('SELECT id FROM accounts WHERE user_id = $1 AND provider_id = $2', [ADMIN_ID, 'credential'])
  if (acctCheck.rows.length === 0) {
    console.error('❌  Something went wrong — admin password was not set.\n')
    process.exit(1)
  }

  console.log('✅  Admin account created successfully!\n')
  console.log('   Email:    ' + ADMIN_EMAIL)
  console.log('   Password: ' + ADMIN_PASSWORD)
  console.log('   Role:     Administrator\n')
  console.log('   You can now log in at /login and access /admin\n')

  await pool.end()
}

main().catch(err => {
  console.error('\n❌  Error:', err.message, '\n')
  process.exit(1)
})

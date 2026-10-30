import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '@/lib/schema'

// Neon and other hosted Postgres providers need explicit SSL on serverless
const needsSsl = (process.env.DATABASE_URL ?? '').includes('sslmode=require')

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
})
export const db = drizzle(pool, { schema })

import { pgTable, boolean, uuid, text, numeric, timestamp, pgEnum, integer } from 'drizzle-orm/pg-core'

// ── Enums ─────────────────────────────────────────────────────────────────
export const tradeSideEnum      = pgEnum('trade_side',      ['buy', 'sell'])
export const tradeStatusEnum    = pgEnum('trade_status',    ['completed', 'failed', 'pending'])
export const transferStatusEnum = pgEnum('transfer_status', ['completed', 'failed', 'pending'])

// ── App tables ─────────────────────────────────────────────────────────────
export const userBalances = pgTable('user_balances', {
  userId:      text('user_id').primaryKey(),
  usdcBalance: numeric('usdc_balance', { precision: 20, scale: 6 }).notNull().default('0'),
  usdBalance:  numeric('usd_balance',  { precision: 20, scale: 2 }).notNull().default('10000.00'),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const usdcTrades = pgTable('usdc_trades', {
  id:         uuid('id').primaryKey().defaultRandom(),
  userId:     text('user_id').notNull(),
  side:       tradeSideEnum('side').notNull(),
  usdcAmount: numeric('usdc_amount', { precision: 20, scale: 6 }).notNull(),
  usdAmount:  numeric('usd_amount',  { precision: 20, scale: 2 }).notNull(),
  price:      numeric('price',       { precision: 10, scale: 6 }).notNull(),
  status:     tradeStatusEnum('status').notNull().default('completed'),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const usdcTransfers = pgTable('usdc_transfers', {
  id:         uuid('id').primaryKey().defaultRandom(),
  userId:     text('user_id').notNull(),
  recipient:  text('recipient').notNull(),
  usdcAmount: numeric('usdc_amount', { precision: 20, scale: 6 }).notNull(),
  note:       text('note').notNull().default(''),
  status:     transferStatusEnum('status').notNull().default('completed'),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// USD transfers (sending dollars to another account)
export const usdTransfers = pgTable('usd_transfers', {
  id:         uuid('id').primaryKey().defaultRandom(),
  userId:     text('user_id').notNull(),
  recipient:  text('recipient').notNull(),
  usdAmount:  numeric('usd_amount', { precision: 20, scale: 2 }).notNull(),
  note:       text('note').notNull().default(''),
  status:     transferStatusEnum('status').notNull().default('completed'),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── User profile extras (stored separately from better-auth's users table) ─
export const userProfiles = pgTable('user_profiles', {
  userId:       text('user_id').primaryKey(),              // FK → users.id
  accountId:    text('account_id').notNull().unique(),     // 10-digit numeric ID e.g. "7823041965"
  pinHash:      text('pin_hash'),                          // bcrypt hash of 4-digit PIN (null until PIN set)
  phone:        text('phone'),
  avatarUrl:    text('avatar_url'),
  referralCode: text('referral_code').notNull().default(''),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Email OTP verifications ────────────────────────────────────────────────
export const emailOtps = pgTable('email_otps', {
  id:        uuid('id').primaryKey().defaultRandom(),
  email:     text('email').notNull(),
  otp:       text('otp').notNull(),          // 6-digit code (stored hashed)
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  used:      boolean('used').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Savings (OWealth-style) ────────────────────────────────────────────────
export const savings = pgTable('savings', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      text('user_id').notNull(),
  usdBalance:  numeric('usd_balance', { precision: 20, scale: 2 }).notNull().default('0'),
  interestRate: numeric('interest_rate', { precision: 5, scale: 4 }).notNull().default('0.0500'), // 5% APY
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Auth tables (better-auth) ──────────────────────────────────────────────
export const users = pgTable('users', {
  id:            text('id').primaryKey(),
  name:          text('name').notNull(),
  email:         text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  isAdmin:       boolean('is_admin').notNull().default(false),
  image:         text('image'),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const sessions = pgTable('sessions', {
  id:        text('id').primaryKey(),
  userId:    text('user_id').notNull(),
  token:     text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const accounts = pgTable('accounts', {
  id:                      text('id').primaryKey(),
  userId:                  text('user_id').notNull(),
  accountId:               text('account_id').notNull(),
  providerId:              text('provider_id').notNull(),
  accessToken:             text('access_token'),
  refreshToken:            text('refresh_token'),
  accessTokenExpiresAt:    timestamp('access_token_expires_at',  { withTimezone: true }),
  refreshTokenExpiresAt:   timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope:                   text('scope'),
  idToken:                 text('id_token'),
  password:                text('password'),
  createdAt:               timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:               timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const verifications = pgTable('verifications', {
  id:         text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value:      text('value').notNull(),
  expiresAt:  timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:  timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

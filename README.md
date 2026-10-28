# Federal Union Bank

A digital banking demo with USDC trading, wallet management, transfers, and everyday services (electricity, airtime, data, loans, credit).

---

## Quick start

### 1. Fix PowerShell execution policy (Windows — one time only)

Open **PowerShell** and run:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### 2. Get a free Postgres database

Go to **[neon.tech](https://neon.tech)**, create a free project, and copy your connection string. It looks like:

```
postgresql://alex:password@ep-cool-darkness.us-east-2.aws.neon.tech/neondb?sslmode=require
```

Alternatively use any local or hosted Postgres instance.

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the two required values:

```powershell
Copy-Item .env.example .env.local
```

Then open `.env.local` and set:

```env
DATABASE_URL=postgresql://...   # your connection string from step 2
BETTER_AUTH_SECRET=             # any random 32+ character string
```

Generate a secret quickly with:
```powershell
[System.Web.Security.Membership]::GeneratePassword(40, 8)
# or on any machine with openssl:
openssl rand -base64 32
```

### 4. Install dependencies

```powershell
pnpm install
```

### 5. Run the database migration

**Option A — using the drizzle-kit push (recommended):**
```powershell
pnpm db:push
```

**Option B — paste the SQL manually:**  
Open `drizzle/0000_init.sql`, copy the contents, and run it in your DB provider's SQL editor (Neon / Supabase both have one built in).

### 6. Start the dev server

```powershell
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## What you get

| Route | Description |
|---|---|
| `/` | Marketing homepage |
| `/login` | Sign in / register |
| `/usdc` | Main dashboard — balances, trade, send, fund |
| `/services/electricity` | Pay electricity bills |
| `/services/airtime` | Mobile airtime top-up |
| `/services/data` | Mobile data bundles |
| `/services/loans` | Loan calculator + application |
| `/services/credit` | Credit score overview |

---

## Tech stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4** + shadcn/ui
- **better-auth** — email/password authentication
- **Drizzle ORM** + **PostgreSQL**
- **CoinGecko API** — live USDC price (optional API key, free public endpoint works without one)

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | ✅ | Random secret (32+ chars) for session signing |
| `BETTER_AUTH_URL` | ✅ | App base URL (`http://localhost:3000` for dev) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Same as above, exposed to client |
| `COINGECKO_API_KEY` | ❌ | Optional — increases CoinGecko rate limit |

---

## Useful commands

```powershell
pnpm dev          # start dev server
pnpm build        # production build
pnpm start        # start production server
pnpm db:push      # sync schema to database
pnpm db:studio    # open Drizzle Studio (visual DB browser)
```

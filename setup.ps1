# Federal Union Bank – one-time setup script
# Run this from the project root after filling in .env.local:
#   .\setup.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Federal Union Bank – Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check .env.local has been configured
$envContent = Get-Content ".env.local" -Raw
if ($envContent -match "REPLACE_THIS_WITH_A_REAL_SECRET") {
    Write-Host "[!] .env.local still has placeholder values." -ForegroundColor Yellow
    Write-Host "    Open .env.local and fill in:" -ForegroundColor Yellow
    Write-Host "      - DATABASE_URL  (get a free DB at https://neon.tech)" -ForegroundColor Yellow
    Write-Host "      - BETTER_AUTH_SECRET  (any random 32+ char string)" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# 2. Install dependencies
Write-Host "[1/3] Installing dependencies..." -ForegroundColor Green
pnpm install
if ($LASTEXITCODE -ne 0) { Write-Host "pnpm install failed." -ForegroundColor Red; exit 1 }

# 3. Run database migration
Write-Host ""
Write-Host "[2/3] Running database migration..." -ForegroundColor Green
$dbUrl = ($envContent | Select-String -Pattern 'DATABASE_URL=(.+)').Matches[0].Groups[1].Value.Trim()
psql $dbUrl -f drizzle/0000_init.sql
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[!] psql not found or migration failed." -ForegroundColor Yellow
    Write-Host "    You can run the migration manually:" -ForegroundColor Yellow
    Write-Host "    psql `"$dbUrl`" -f drizzle/0000_init.sql" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "    Or paste the contents of drizzle/0000_init.sql into your DB provider's SQL editor." -ForegroundColor Yellow
}

# 4. Done
Write-Host ""
Write-Host "[3/3] Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Start the dev server with:" -ForegroundColor Cyan
Write-Host "  pnpm dev" -ForegroundColor White
Write-Host ""
Write-Host "Then open http://localhost:3000 in your browser." -ForegroundColor Cyan
Write-Host ""

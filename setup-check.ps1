# CoachMe infra setup + verification
# Run from anywhere:  powershell -ExecutionPolicy Bypass -File .\setup-check.ps1
# Interactive steps (vercel login/link) will prompt you - that's expected.

$ErrorActionPreference = "Stop"
$repo = "C:\Users\noahr\Projects\coachme"

function Step($msg)  { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Ok($msg)    { Write-Host "    OK: $msg" -ForegroundColor Green }
function Fail($msg)  { Write-Host "    FAIL: $msg" -ForegroundColor Red; exit 1 }
function Warn($msg)  { Write-Host "    WARN: $msg" -ForegroundColor Yellow }

# 1. Go to repo
Step "Changing to repo"
if (-not (Test-Path $repo)) { Fail "Repo not found at $repo" }
Set-Location $repo
Ok (Get-Location)

# 2. Disk space
Step "Checking disk space (need ~1 GB free for the video mirror)"
$freeGB = [math]::Round((Get-PSDrive C).Free / 1GB, 2)
if ($freeGB -lt 1) { Fail "Only $freeGB GB free on C:. Clear space (try 'pnpm store prune') and rerun." }
Ok "$freeGB GB free"

# 3. Vercel CLI
Step "Checking Vercel CLI"
$vercelCmd = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelCmd) {
    Warn "Vercel CLI not found. Installing..."
    pnpm add -g vercel
    if ($LASTEXITCODE -ne 0) { Fail "Could not install Vercel CLI" }
}
Ok "vercel $(vercel --version)"

# 4. Login (no-op if already logged in)
Step "Vercel login (browser may open; skip happens automatically if already authed)"
$ErrorActionPreference = "Continue"   # vercel prints its banner to stderr; PS 5.1 treats that as fatal under Stop
$who = cmd /c "vercel whoami 2>nul"
if ($LASTEXITCODE -ne 0) {
    cmd /c "vercel login"
    if ($LASTEXITCODE -ne 0) { $ErrorActionPreference = "Stop"; Fail "Vercel login failed" }
    $who = cmd /c "vercel whoami 2>nul"
}
$ErrorActionPreference = "Stop"
Ok "Logged in as $who"

# 5. Link (no-op if .vercel folder already exists)
Step "Linking folder to Vercel project"
if (-not (Test-Path ".vercel\project.json")) {
    Write-Host "    Pick the 'coachme' project when asked, accept defaults." -ForegroundColor Yellow
    $ErrorActionPreference = "Continue"
    cmd /c "vercel link"
    $linkExit = $LASTEXITCODE
    $ErrorActionPreference = "Stop"
    if ($linkExit -ne 0) { Fail "vercel link failed" }
}
Ok "Project linked"

# 6. Pull env vars
Step "Pulling env vars into .env.local"
$ErrorActionPreference = "Continue"
cmd /c "vercel env pull .env.local"
$pullExit = $LASTEXITCODE
$ErrorActionPreference = "Stop"
if ($pullExit -ne 0) { Fail "vercel env pull failed" }
Ok ".env.local written"

# 7. Verify Blob token
Step "Verifying Blob token"
if (-not (Select-String -Path .env.local -Pattern "BLOB_READ_WRITE_TOKEN=." -Quiet)) {
    Fail "BLOB_READ_WRITE_TOKEN missing. In Vercel dashboard: Storage -> coachme-media -> ensure the read-write token env var was added to the connection, then rerun."
}
Ok "BLOB_READ_WRITE_TOKEN present"

# 8. Verify Supabase keys
Step "Verifying Supabase keys"
$missing = @()
foreach ($k in "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY") {
    if (-not (Select-String -Path .env.local -Pattern "$k=." -Quiet)) { $missing += $k }
}
if ($missing.Count -gt 0) {
    Fail "Missing in .env.local: $($missing -join ', '). Add them in Vercel dashboard (Settings -> Environment Variables, all environments) and rerun."
}
Ok "All three Supabase vars present"

# 9. Confirm .env.local is gitignored
Step "Confirming .env.local is gitignored"
git check-ignore .env.local *> $null
if ($LASTEXITCODE -ne 0) { Fail ".env.local is NOT gitignored. STOP - do not commit anything. Add '.env.local' to .gitignore first." }
Ok ".env.local is ignored by git"

# 10. Sync repo
Step "Pulling latest from main"
git pull origin main --rebase
if ($LASTEXITCODE -ne 0) { Fail "git pull failed - resolve conflicts manually" }
Ok "Repo up to date"

# 11. Install + build
Step "Installing dependencies"
pnpm install
if ($LASTEXITCODE -ne 0) { Fail "pnpm install failed" }
Ok "Dependencies installed"

Step "Building (this takes a minute)"
pnpm build
if ($LASTEXITCODE -ne 0) { Fail "Build failed - fix before letting Noah start" }
Ok "Build passed"

Write-Host "`n=============================================" -ForegroundColor Green
Write-Host " ALL CHECKS PASSED - infra setup is complete " -ForegroundColor Green
Write-Host " Noah is clear to run Stage 1 in Claude Code " -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

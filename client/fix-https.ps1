Write-Host "`n🔧 Fixing API URLs and rebuilding securely..." -ForegroundColor Cyan

# 1) Replace http:// with https:// in .env
if (Test-Path .\.env) {
  (Get-Content .\.env -Raw) -replace "http://", "https://" | Set-Content .\.env
  Write-Host "✅ Updated .env" -ForegroundColor Green
}

# 2) Replace http:// with https:// in src/lib/api.js
$apiPath = ".\src\lib\api.js"
if (Test-Path $apiPath) {
  (Get-Content $apiPath -Raw) -replace "http://", "https://" | Set-Content $apiPath
  Write-Host "✅ Updated src\lib\api.js" -ForegroundColor Green
}

# 3) Remove old dist folder
if (Test-Path .\dist) {
  Remove-Item -Recurse -Force .\dist
  Write-Host "🧹 Deleted old dist folder" -ForegroundColor Yellow
}

# 4) Run build
Write-Host "🏗️  Building project..." -ForegroundColor Yellow
npm run build

# 5) Scan for leftover http:// references
Write-Host "🔎 Scanning build for insecure URLs..." -ForegroundColor Yellow
$matches = Select-String -Path ".\dist\assets\*.js" -Pattern "http://" -List

if ($matches) {
  Write-Host "❌ Found http:// references in build files:" -ForegroundColor Red
  $matches | ForEach-Object { Write-Host "→ $($_.Filename):$($_.LineNumber)" }
} else {
  Write-Host "✅ Build is clean — no insecure URLs found!" -ForegroundColor Green
}

Write-Host "`n✨ Done!" -ForegroundColor Cyan

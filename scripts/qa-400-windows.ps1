$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
Write-Host "SAANJH v0.8 - Parenting quality tests (fictional families only)" -ForegroundColor DarkGreen
Write-Host "This uses paid Gemini requests. Check your NZ$10 spending cap and prepaid balance."
Write-Host "Even a spending cap may enforce late: overages are possible."
Write-Host "5 = Quick check (recommended)" -ForegroundColor Cyan
Write-Host "20 = Small diverse batch" -ForegroundColor Cyan
Write-Host "50 = One question per category" -ForegroundColor Cyan
Write-Host "100 = WITHHELD evaluation cases; run after development is locked" -ForegroundColor Yellow
Write-Host "400 = ALL cases, uses significant API requests; not recommended initially" -ForegroundColor Yellow
$n=Read-Host 'Enter 5, 20, 50, 100 or 400'
if($n -notin @('5','20','50','100','400')) { Write-Host 'No tests started.'; return }
if($n -eq '400') {
 $confirm=Read-Host 'Run 400 paid tests? Type RUN 400 to continue'
 if($confirm -ne 'RUN 400') { Write-Host 'Cancelled'; return }
}
$secret=Read-Host 'Paste existing Gemini API key (hidden)' -AsSecureString
$ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try { $env:GEMINI_API_KEY=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
finally {[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)}
$env:SAANJH_QA_COUNT=$n
try{
 & node --experimental-strip-types scripts/qa-live-400.ts
 $latest=Get-ChildItem -Path 'qa/reports' -Filter 'v08-live-*.json' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
 if($latest) {
  Compress-Archive -Path $latest.FullName -DestinationPath 'Saanjh_400_QA_Results.zip' -Force
  Write-Host 'Result ready to share (no API key): Saanjh_400_QA_Results.zip' -ForegroundColor Green
 }
}finally { Remove-Item Env:GEMINI_API_KEY -ErrorAction SilentlyContinue; Remove-Item Env:SAANJH_QA_COUNT -ErrorAction SilentlyContinue }

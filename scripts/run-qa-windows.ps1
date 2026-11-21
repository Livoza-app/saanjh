$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
Write-Host ''
Write-Host '=========================================' -ForegroundColor DarkGreen
Write-Host '  SAANJH — REAL GEMINI QUALITY TESTS' -ForegroundColor Green
Write-Host '=========================================' -ForegroundColor DarkGreen
Write-Host 'Only fictional parenting situations are used.'
Write-Host 'Your API key will not be saved to any file.'
Write-Host 'You can review your NZ$10 project spending cap in Google AI Studio.'
Write-Host 'An API spend cap may not prevent small delayed overages.'
Write-Host ''
Write-Host '1 = Run only 5 example questions (recommended first)' -ForegroundColor Cyan
Write-Host '2 = Run all 50 scenarios (can take time and use more API credits)' -ForegroundColor Cyan
$choice = Read-Host 'Enter 1 or 2'
if($choice -ne '1' -and $choice -ne '2') { Write-Host 'No tests started.'; return }
$env:SAANJH_QA_CASES = if($choice -eq '2') { '50' } else { '5' }
$secret = Read-Host 'Paste your Gemini API key (input hidden)' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try { $env:GEMINI_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
try {
  & node --experimental-strip-types scripts/qa-live.ts
  if ($choice -eq '2') {
    $memory = Read-Host 'Also test repeated and new conversations? Enter Y or N'
    if($memory -match '^[Yy]') { & node --experimental-strip-types scripts/qa-memory-live.ts }
  }
  $latest = @(Get-ChildItem -Path 'qa/reports' -Filter 'gemini-live-*.json' | Sort-Object LastWriteTime -Descending | Select-Object -First 1)
  $mem = @(Get-ChildItem -Path 'qa/reports' -Filter 'memory-live-*.json' | Sort-Object LastWriteTime -Descending | Select-Object -First 1)
  $pack = @($latest + $mem | Where-Object {$_ -ne $null} | Select-Object -ExpandProperty FullName)
  if ($pack.Count -gt 0) {
    Compress-Archive -Path $pack -DestinationPath 'Saanjh_QA_RESULTS.zip' -Force
    Write-Host ''
    Write-Host 'COMPLETE — share this one file for review:' -ForegroundColor Green
    Write-Host (Join-Path $Root 'Saanjh_QA_RESULTS.zip')
  }
} finally {
  Remove-Item Env:GEMINI_API_KEY -ErrorAction SilentlyContinue
  Remove-Item Env:SAANJH_QA_CASES -ErrorAction SilentlyContinue
}

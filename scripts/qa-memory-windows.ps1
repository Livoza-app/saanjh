Set-Location (Split-Path -Parent $PSScriptRoot)
Write-Host 'SAANJH: LIVE MEMORY QA — FICTIONAL NAMES ONLY' -ForegroundColor Cyan
Write-Host 'This test can call the paid Gemini API up to 10 times. Do not paste your key into any HTML files.'
$secret = Read-Host 'Paste Gemini API key (input hidden)' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try { $env:GEMINI_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
try { node --experimental-strip-types scripts/qa-memory-live.ts }
finally { Remove-Item Env:GEMINI_API_KEY -ErrorAction SilentlyContinue }

Set-Location (Split-Path -Parent $PSScriptRoot)
Write-Host 'SAANJH: LIVE GEMINI QA — FICTIONAL FAMILIES ONLY' -ForegroundColor Cyan
Write-Host "This test makes up to $env:SAANJH_QA_CASES paid API requests. Budget cap is controlled in Google AI Studio."
Write-Host 'Do NOT paste the key into this chat or any HTML file. It is not written to a file.'
$secret = Read-Host 'Paste Gemini API key (input hidden)' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try { $env:GEMINI_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
try { node --experimental-strip-types scripts/qa-live.ts }
finally { Remove-Item Env:GEMINI_API_KEY -ErrorAction SilentlyContinue }

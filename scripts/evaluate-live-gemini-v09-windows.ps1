Set-Location (Split-Path -Parent $PSScriptRoot)
Write-Host "Saanjh v0.9 live Gemini evaluation (fictional cases only)" -ForegroundColor Cyan
Write-Host "The key is entered as hidden input, kept in memory, and removed after the run. API usage may incur cost."
$secret = Read-Host "Paste Gemini API key (input hidden)" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try { $env:GEMINI_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
try {
    node --experimental-strip-types scripts/evaluate-live-gemini-v09.ts
} finally {
    Remove-Item Env:GEMINI_API_KEY -ErrorAction SilentlyContinue
}


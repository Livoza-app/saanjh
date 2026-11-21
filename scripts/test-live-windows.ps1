Set-Location (Split-Path -Parent $PSScriptRoot)
Write-Host "Saanjh: one live Gemini test using fictional names only" -ForegroundColor Cyan
Write-Host "Your key will not be saved to any file. This test may cost API tokens."
$secret = Read-Host "Paste Gemini API key (input hidden)" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try { $env:GEMINI_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
try {
    node --experimental-strip-types scripts/test-live-gemini.ts
} finally {
    Remove-Item Env:GEMINI_API_KEY -ErrorAction SilentlyContinue
}

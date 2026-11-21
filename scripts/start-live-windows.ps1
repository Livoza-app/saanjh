Set-Location (Split-Path -Parent $PSScriptRoot)
Write-Host "Saanjh Private Gemini Test - local computer only"
Write-Host "Your Gemini key will not be stored in a file. Never paste it into a chat or share it."
$secret = Read-Host "Paste your Gemini API key (hidden)" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try {
  $env:GEMINI_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}
Write-Host "Open http://127.0.0.1:3030 in your browser. Ctrl+C stops the server."
node --experimental-strip-types src/preview-server.ts
Remove-Item Env:GEMINI_API_KEY -ErrorAction SilentlyContinue

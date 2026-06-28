Write-Host "=========================================="
Write-Host "   Microsoft Store Initialization"
Write-Host "=========================================="
Write-Host "Starting interactive login..."

Set-Location -Path $PSScriptRoot

if (Test-Path ".\msstore-cli\msstore.exe") {
    .\msstore-cli\msstore.exe init
    Write-Host "`nInitialization Complete! You can now use publish.ps1" -ForegroundColor Green
} else {
    Write-Host "`nError: Could not find msstore.exe in the project folder!" -ForegroundColor Red
}

Write-Host "`nPress any key to close this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

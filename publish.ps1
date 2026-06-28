param (
    [string]$Email = "devibe70@gmail.com"
)

Write-Host "🚀 Starting OptiSpace AI 1-Click Store Publish..." -ForegroundColor Cyan

# 1. Build the Tauri MSI Release
Write-Host "`n[1/3] 📦 Compiling OptiSpace AI release build..." -ForegroundColor Yellow
cd desktop
# Ensure we use the MSVC toolchain
rustup default stable-x86_64-pc-windows-msvc
npm run tauri build
cd ..

# The path where Tauri outputs the final MSI installer
$installerPath = "desktop\src-tauri\target\release\bundle\msi\optispace-ai_0.1.0_x64_en-US.msi"

if (-Not (Test-Path $installerPath)) {
    Write-Host "❌ Error: Build failed or installer not found at $installerPath" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Installer successfully built!" -ForegroundColor Green

# 2. Authenticate with MS Store (if needed)
Write-Host "`n[2/3] 🌐 Connecting to Microsoft Partner Center..." -ForegroundColor Yellow
Write-Host "Checking authentication for: $Email" -ForegroundColor Magenta
# The msstore CLI will pop up a browser window to login if not already authenticated.
# msstore reconfigure

# 3. Publish to Microsoft Store
Write-Host "`n[3/3] 📤 Pushing OptiSpace AI to the Microsoft Store..." -ForegroundColor Yellow
# Note: You must run 'msstore init' once manually before this script can push automatically.
# This pushes the generated MSI to your configured app listing.
.\msstore-cli\msstore.exe submission update --app-id "9PH39ZHDXNM1" --installer $installerPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n🎉 SUCCESS: OptiSpace AI has been successfully uploaded to the Microsoft Store!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️ WARNING: The upload failed. Ensure you have run 'msstore init' first to link your Microsoft Partner Center account." -ForegroundColor Red
}

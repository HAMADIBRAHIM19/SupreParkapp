# SuperParking - Android setup & open script (Windows PowerShell)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/setup-android.ps1
$ErrorActionPreference = "Stop"

Write-Host "📦 1/5 Installing npm dependencies..."
npm install

Write-Host "🏗  2/5 Building web project (dist/)..."
npm run build

if (-Not (Test-Path "android")) {
  Write-Host "📱 3/5 Adding Android platform..."
  npx cap add android
} else {
  Write-Host "📱 3/5 Android platform already exists, skipping add."
}

Write-Host "🔄 4/5 Syncing web build into Android project..."
npx cap sync android

Write-Host "🚀 5/5 Opening Android Studio..."
npx cap open android

Write-Host "✅ Done. Wait for Gradle Sync, then: Build → Generate Signed Bundle / APK."

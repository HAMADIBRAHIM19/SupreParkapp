#!/usr/bin/env bash
# SuperParking - Android setup & open script
# Usage: bash scripts/setup-android.sh
set -e

echo "📦 1/5 Installing npm dependencies..."
npm install

echo "🏗  2/5 Building web project (dist/)..."
npm run build

if [ ! -d "android" ]; then
  echo "📱 3/5 Adding Android platform..."
  npx cap add android
else
  echo "📱 3/5 Android platform already exists, skipping add."
fi

echo "🔄 4/5 Syncing web build into Android project..."
npx cap sync android

echo "🚀 5/5 Opening Android Studio..."
npx cap open android

echo "✅ Done. Wait for Gradle Sync inside Android Studio, then: Build → Generate Signed Bundle / APK."

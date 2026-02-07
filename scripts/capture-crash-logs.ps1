# Capture Android crash logs for Flow Catalyst
# Run this while reproducing the crash (app install + open)
# Requires: adb (Android SDK), device/emulator connected

Write-Host "Clearing logcat and starting capture..."
Write-Host "Reproduce the crash now (install app, open it)"
Write-Host "Press Ctrl+C when done to save logs"
Write-Host ""

$logFile = "crash_log_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
adb logcat -c
adb logcat -v time *:E ReactNative:V ReactNativeJS:V Expo:V | Tee-Object -FilePath $logFile

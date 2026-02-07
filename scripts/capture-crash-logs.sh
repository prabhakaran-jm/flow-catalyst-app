#!/bin/bash
# Capture Android crash logs for Flow Catalyst
# Run this while reproducing the crash (app install + open)
# Requires: adb (Android SDK), device/emulator connected

echo "Clearing logcat and starting capture..."
echo "Reproduce the crash now (install app, open it)"
echo "Press Ctrl+C when done to save logs"
echo ""

logfile="crash_log_$(date +%Y%m%d_%H%M%S).txt"
adb logcat -c
adb logcat -v time *:E ReactNative:V ReactNativeJS:V Expo:V 2>&1 | tee "$logfile"

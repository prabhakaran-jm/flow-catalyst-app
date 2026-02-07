#!/bin/bash

# Flow Catalyst - Local Testing Script
# This script helps test the complete setup locally

set -e

echo "🚀 Flow Catalyst - Local Testing Setup"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Supabase is running
echo "📦 Checking Supabase..."
if supabase status > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Supabase is running"
    SUPABASE_URL=$(supabase status | grep "API URL" | awk '{print $3}')
    echo "   API URL: $SUPABASE_URL"
else
    echo -e "${YELLOW}⚠${NC} Supabase is not running"
    echo "   Starting Supabase..."
    supabase start
fi

# Check if Edge Functions are running
echo ""
echo "⚡ Checking Edge Functions..."
if lsof -Pi :9999 -sTCP:LISTEN -t >/dev/null 2>&1 || netstat -an | grep 9999 | grep LISTEN > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Edge Functions server detected on port 9999"
else
    echo -e "${YELLOW}⚠${NC} Edge Functions server not detected"
    echo "   Start in a separate terminal:"
    echo "   npx supabase functions serve create-catalyst run-catalyst refine --no-verify-jwt --env-file .env"
fi

# Check environment variables
echo ""
echo "🔐 Checking Environment Variables..."
cd apps/mobile

if [ -f "src/env.ts" ]; then
    echo -e "${GREEN}✓${NC} env.ts exists"
    
    # Check if values are configured
    if grep -q "YOUR_SUPABASE_URL_HERE\|127.0.0.1:54321" src/env.ts; then
        echo -e "${GREEN}✓${NC} Using local Supabase configuration"
    else
        echo -e "${YELLOW}⚠${NC} Check if production URLs are intended"
    fi
else
    echo -e "${RED}✗${NC} env.ts not found"
    echo "   Copy from env.example.ts and configure"
fi

# Check dependencies
echo ""
echo "📚 Checking Dependencies..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules exists"
else
    echo -e "${YELLOW}⚠${NC} Dependencies not installed"
    echo "   Run: pnpm install"
fi

# Check if RevenueCat package is installed
if grep -q "react-native-purchases" package.json; then
    if [ -d "node_modules/react-native-purchases" ]; then
        echo -e "${GREEN}✓${NC} react-native-purchases installed"
    else
        echo -e "${YELLOW}⚠${NC} react-native-purchases in package.json but not installed"
        echo "   Run: pnpm install"
    fi
else
    echo -e "${YELLOW}⚠${NC} react-native-purchases not in package.json"
fi

echo ""
echo "✅ Setup Check Complete!"
echo ""
echo "Next steps:"
echo "1. Start Edge Functions: npx supabase functions serve create-catalyst run-catalyst refine --no-verify-jwt --env-file .env"
echo "2. Start Expo: pnpm start"
echo "3. Open app on device/emulator"
echo "4. Follow TESTING_CHECKLIST.md"

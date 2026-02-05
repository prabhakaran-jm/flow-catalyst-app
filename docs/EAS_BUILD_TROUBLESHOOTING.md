# EAS Build Troubleshooting Guide

## Prebuild Failures

If your EAS build fails during the "Prebuild" phase, follow these steps:

### Step 1: Check Build Logs

1. Go to the build URL provided in the error:
   ```
   https://expo.dev/accounts/prabhakaranjm/projects/flow-catalyst/builds/[BUILD_ID]
   ```

2. Click on the **"Prebuild"** phase in the build timeline

3. Look for error messages - common ones include:
   - Plugin resolution errors
   - Missing dependencies
   - Invalid configuration
   - Asset file issues

### Step 2: Test Prebuild Locally

Test the prebuild process locally to catch issues early:

```bash
cd apps/mobile

# Clean any existing native directories
rm -rf android ios

# Run prebuild locally
npx expo prebuild --clean

# If this fails, you'll see the same error EAS sees
```

### Step 3: Common Issues & Fixes

#### Issue: Plugin Resolution Error
**Error**: `Failed to resolve plugin for module...`

**Fix**: Ensure all plugins are properly installed:
```bash
cd apps/mobile
pnpm install
```

Verify plugins in `app.json` match installed packages:
- `expo-router` → should be in dependencies ✓
- Any other plugins → must be in dependencies

#### Issue: Missing Native Module Configuration
**Error**: `react-native-purchases` or other native modules fail

**Fix**: `react-native-purchases` doesn't require an Expo plugin, but ensure:
1. Package is in `package.json` dependencies ✓
2. You're using a **development build** (not Expo Go)
3. Native code is properly linked (handled automatically by Expo)

#### Issue: Invalid app.json Configuration
**Error**: Configuration validation errors

**Fix**: Validate your `app.json`:
```bash
npx expo config --type introspect
```

#### Issue: Asset Files Missing
**Error**: `Cannot find asset...`

**Fix**: Verify all assets exist:
- `./assets/icon.png`
- `./assets/splash.png`
- `./assets/adaptive-icon.png`
- `./assets/favicon.png`

### Step 4: Debug Build Configuration

Check your build configuration:

```bash
# View resolved config
cd apps/mobile
npx expo config --type public

# Check for plugin issues
npx expo-doctor
```

### Step 5: Clean Build

If issues persist, try a clean build:

```bash
# Clear EAS build cache
eas build --platform android --profile production --clear-cache

# Or locally
cd apps/mobile
rm -rf .expo android ios node_modules
pnpm install
```

## Getting Help

When asking for help, provide:

1. **Build Log URL** - The full URL from the error message
2. **Prebuild Phase Logs** - Copy the error from the Prebuild phase
3. **Local Prebuild Test** - Results of `npx expo prebuild --clean`
4. **app.json** - Your current app.json configuration
5. **package.json** - Your dependencies

## Quick Checklist

Before building, ensure:

- [ ] All dependencies are installed (`pnpm install`)
- [ ] `app.json` is valid (no syntax errors)
- [ ] All assets exist in `./assets/`
- [ ] No `android/` or `ios/` directories are committed (should be in .gitignore)
- [ ] Plugins in `app.json` match installed packages
- [ ] EAS project is linked (`eas project:info`)

## Next Steps

1. **Check the build logs** at the URL provided
2. **Run local prebuild** to reproduce the error
3. **Share the specific error** from the logs for targeted help

# App Assets

This directory contains the app icons and splash screens.

## Current Files

- `icon.png` - Main app icon (1024x1024 recommended)
- `adaptive-icon.png` - Android adaptive icon foreground (1024x1024, should have padding/safe zone)
- `splash.png` - Splash screen (recommended: 1284x2778 for mobile)
- `favicon.png` - Web favicon (512x512 recommended)

## Important Notes

⚠️ **These are placeholder images** - Replace them with your actual app branding before production!

## Creating Proper Assets

### Using Expo Tools

1. **Expo Icon Generator**: https://expo-icon-builder.com
   - Upload your icon design
   - Generates all required sizes automatically

2. **Manual Creation**:
   - **icon.png**: 1024x1024 PNG, square, no transparency needed
   - **adaptive-icon.png**: 1024x1024 PNG, transparent background, icon centered with padding (Android adaptive icon safe zone)
   - **splash.png**: 1284x2778 PNG (or your target device size)
   - **favicon.png**: 512x512 PNG, transparent background preferred

### Android Adaptive Icon Guidelines

The `adaptive-icon.png` should follow Android's adaptive icon guidelines:
- Full image: 1024x1024px
- Safe zone (where icon content should be): ~768x768px centered
- Outer 128px on each side may be cropped/masked by system
- Use transparent background
- Keep important content within the safe zone

## Current Status

All placeholder images are valid PNG files and will work for development/testing. Replace with production assets before release.

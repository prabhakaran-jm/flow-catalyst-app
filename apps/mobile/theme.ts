export const theme = {
  colors: {
    background: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#666666',
    accent: '#6366F1', // Indigo accent color (primary brand purple)
    accentLight: '#818CF8',
    accentDark: '#4F46E5',
    accentLightBackground: '#F0F5FF', // Light purple tint for highlight cards
    border: '#E5E7EB',
    error: '#EF4444',
    success: '#10B981',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
  },
} as const;

export type Theme = typeof theme;

/**
 * Career Compass Design System - Spacing & Layout
 * 8pt grid system (Apple-style)
 */

// Base unit (8pt grid)
const BASE = 8;

// Spacing Scale
export const Spacing = {
  none: 0,
  xs: BASE * 0.5,   // 4
  sm: BASE,         // 8
  md: BASE * 2,     // 16
  lg: BASE * 3,     // 24
  xl: BASE * 4,     // 32
  xxl: BASE * 5,    // 40
  xxxl: BASE * 6,   // 48
} as const;

// Border Radius
export const BorderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

// Shadow Styles (Apple-inspired)
export const Shadow = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  xxl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

// Layout Constants
export const Layout = {
  // Screen padding
  screenPaddingHorizontal: Spacing.md,
  screenPaddingVertical: Spacing.lg,

  // Card
  cardPadding: Spacing.md,
  cardBorderRadius: BorderRadius.xl,

  // Button
  buttonHeight: {
    sm: 36,
    md: 44,
    lg: 52,
  },
  buttonBorderRadius: BorderRadius.md,

  // Input
  inputHeight: 48,
  inputBorderRadius: BorderRadius.md,

  // Bottom tab bar
  tabBarHeight: 84,

  // Header
  headerHeight: 56,

  // Max content width (for tablets)
  maxContentWidth: 428,
} as const;

// Animation Durations
export const Duration = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 800,
} as const;

// Easing (for Reanimated)
export const Easing = {
  easeInOut: 'easeInOut',
  easeIn: 'easeIn',
  easeOut: 'easeOut',
  linear: 'linear',
  spring: {
    damping: 15,
    stiffness: 150,
  },
} as const;

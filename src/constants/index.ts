/**
 * Career Compass Design System - Main Export
 */

export * from './colors';
export * from './typography';
export * from './spacing';

// Theme object for easy access
import { Colors } from './colors';
import { FontFamily, FontWeight, FontSize, TextStyle } from './typography';
import { Spacing, BorderRadius, Shadow, Layout, Duration } from './spacing';

export const Theme = {
  colors: Colors,
  fonts: {
    family: FontFamily,
    weight: FontWeight,
    size: FontSize,
  },
  text: TextStyle,
  spacing: Spacing,
  radius: BorderRadius,
  shadow: Shadow,
  layout: Layout,
  duration: Duration,
} as const;

export default Theme;

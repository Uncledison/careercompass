/**
 * Career Compass Design System - Typography
 * Apple SF Pro inspired typography scale
 */

import { Platform } from 'react-native';

// Font Family (System fonts for now, can be replaced with custom fonts)
export const FontFamily = {
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  semibold: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    default: 'System',
  }),
} as const;

// Font Weights
export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

// Font Sizes (Apple Human Interface Guidelines inspired)
export const FontSize = {
  // Display
  largeTitle: 34,
  title1: 28,
  title2: 22,
  title3: 20,

  // Body
  headline: 17,
  body: 17,
  callout: 16,
  subhead: 15,
  footnote: 13,
  caption1: 12,
  caption2: 11,

  // Custom for kids
  kidTitle: 24,
  kidBody: 18,
  kidCaption: 14,
} as const;

// Line Heights
export const LineHeight = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
  loose: 1.8,
} as const;

// Letter Spacing
export const LetterSpacing = {
  tighter: -0.5,
  tight: -0.3,
  normal: 0,
  wide: 0.5,
  wider: 1,
} as const;

// Pre-defined Text Styles
export const TextStyle = {
  // Large titles
  largeTitle: {
    fontSize: FontSize.largeTitle,
    fontWeight: FontWeight.bold,
    letterSpacing: LetterSpacing.tight,
    lineHeight: FontSize.largeTitle * LineHeight.tight,
  },
  title1: {
    fontSize: FontSize.title1,
    fontWeight: FontWeight.bold,
    letterSpacing: LetterSpacing.tight,
    lineHeight: FontSize.title1 * LineHeight.tight,
  },
  title2: {
    fontSize: FontSize.title2,
    fontWeight: FontWeight.bold,
    letterSpacing: LetterSpacing.tight,
    lineHeight: FontSize.title2 * LineHeight.normal,
  },
  title3: {
    fontSize: FontSize.title3,
    fontWeight: FontWeight.semibold,
    letterSpacing: LetterSpacing.normal,
    lineHeight: FontSize.title3 * LineHeight.normal,
  },

  // Body text
  headline: {
    fontSize: FontSize.headline,
    fontWeight: FontWeight.semibold,
    letterSpacing: LetterSpacing.normal,
    lineHeight: FontSize.headline * LineHeight.normal,
  },
  body: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.regular,
    letterSpacing: LetterSpacing.normal,
    lineHeight: FontSize.body * LineHeight.relaxed,
  },
  callout: {
    fontSize: FontSize.callout,
    fontWeight: FontWeight.regular,
    letterSpacing: LetterSpacing.normal,
    lineHeight: FontSize.callout * LineHeight.normal,
  },
  subhead: {
    fontSize: FontSize.subhead,
    fontWeight: FontWeight.regular,
    letterSpacing: LetterSpacing.normal,
    lineHeight: FontSize.subhead * LineHeight.normal,
  },
  footnote: {
    fontSize: FontSize.footnote,
    fontWeight: FontWeight.regular,
    letterSpacing: LetterSpacing.normal,
    lineHeight: FontSize.footnote * LineHeight.normal,
  },
  caption1: {
    fontSize: FontSize.caption1,
    fontWeight: FontWeight.regular,
    letterSpacing: LetterSpacing.normal,
    lineHeight: FontSize.caption1 * LineHeight.normal,
  },
  caption2: {
    fontSize: FontSize.caption2,
    fontWeight: FontWeight.regular,
    letterSpacing: LetterSpacing.normal,
    lineHeight: FontSize.caption2 * LineHeight.normal,
  },

  // Kid-friendly styles
  kidTitle: {
    fontSize: FontSize.kidTitle,
    fontWeight: FontWeight.bold,
    letterSpacing: LetterSpacing.normal,
    lineHeight: FontSize.kidTitle * LineHeight.relaxed,
  },
  kidBody: {
    fontSize: FontSize.kidBody,
    fontWeight: FontWeight.medium,
    letterSpacing: LetterSpacing.wide,
    lineHeight: FontSize.kidBody * LineHeight.loose,
  },
  kidCaption: {
    fontSize: FontSize.kidCaption,
    fontWeight: FontWeight.regular,
    letterSpacing: LetterSpacing.normal,
    lineHeight: FontSize.kidCaption * LineHeight.normal,
  },
} as const;

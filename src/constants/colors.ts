/**
 * Career Compass Design System - Colors
 * Apple-inspired color palette with Korean education context
 */

export const Colors = {
  // Primary Brand Colors
  primary: {
    main: '#667eea',
    light: '#8b9cf7',
    dark: '#4c5fd7',
    gradient: ['#667eea', '#764ba2'],
  },

  // Secondary Colors
  secondary: {
    main: '#764ba2',
    light: '#9b6fc2',
    dark: '#5a3580',
  },

  // 6 Career Fields Colors
  career: {
    humanities: {
      main: '#9B59B6',
      light: '#BB8FCE',
      dark: '#7D3C98',
      gradient: ['#9B59B6', '#8E44AD'],
    },
    social: {
      main: '#3498DB',
      light: '#5DADE2',
      dark: '#2980B9',
      gradient: ['#3498DB', '#2980B9'],
    },
    natural: {
      main: '#27AE60',
      light: '#58D68D',
      dark: '#1E8449',
      gradient: ['#27AE60', '#1ABC9C'],
    },
    engineering: {
      main: '#1ABC9C',
      light: '#48C9B0',
      dark: '#17A589',
      gradient: ['#1ABC9C', '#16A085'],
    },
    medicine: {
      main: '#E74C3C',
      light: '#EC7063',
      dark: '#C0392B',
      gradient: ['#E74C3C', '#C0392B'],
    },
    arts: {
      main: '#F39C12',
      light: '#F5B041',
      dark: '#D68910',
      gradient: ['#F39C12', '#E67E22'],
    },
  },

  // Semantic Colors
  semantic: {
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#007AFF',
  },

  // Grayscale (Apple-style)
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F7',
    200: '#E5E5EA',
    300: '#D1D1D6',
    400: '#C7C7CC',
    500: '#8E8E93',
    600: '#636366',
    700: '#48484A',
    800: '#3A3A3C',
    900: '#1C1C1E',
  },

  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F5F5F7',
    tertiary: '#FAFAFA',
  },

  // Text Colors
  text: {
    primary: '#1C1C1E',
    secondary: '#8E8E93',
    tertiary: '#C7C7CC',
    inverse: '#FFFFFF',
  },

  // Character Colors
  character: {
    skin: {
      light: '#FFE5D9',
      medium: '#FFD5C2',
    },
    hair: {
      brown: '#4A3728',
      black: '#2D1B14',
    },
    blush: '#FFB5A7',
    mouth: '#E07A5F',
  },

  // Transparent
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ColorKey = keyof typeof Colors;
export type CareerFieldKey = keyof typeof Colors.career;

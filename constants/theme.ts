import { Platform } from 'react-native';

// Cyberpunk / Futuristic Palette
const palette = {
  // Core
  primary: '#8B5CF6', // Violet
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',
  
  secondary: '#EC4899', // Pink
  secondaryLight: '#F472B6',
  secondaryDark: '#DB2777',

  // Gradients
  gradientStart: '#8B5CF6',
  gradientEnd: '#EC4899',

  // Dark Mode
  darkBackground: '#0B0B15', // Deep space black/violet
  darkCard: '#1A1A24',       // Slightly lighter
  darkCardBorder: 'rgba(139, 92, 246, 0.2)', // Subtle purple border
  darkInput: '#232330',
  darkText: '#FFFFFF',
  darkTextSecondary: '#9CA3AF',

  // Light Mode
  lightBackground: '#FFFFFF',
  lightCard: '#F8FAFC',
  lightCardBorder: 'rgba(139, 92, 246, 0.1)',
  lightInput: '#F3F4F6',
  lightText: '#1F2937',
  lightTextSecondary: '#6B7280',
};

export const Colors = {
  light: {
    text: palette.lightText,
    textSecondary: palette.lightTextSecondary,
    background: palette.lightBackground,
    card: palette.lightCard,
    cardBorder: palette.lightCardBorder,
    input: palette.lightInput,
    tint: palette.primary,
    primary: palette.primary,
    secondary: palette.secondary,
    icon: palette.lightTextSecondary,
    tabIconDefault: '#9CA3AF',
    tabIconSelected: palette.primary,
    gradients: {
      primary: [palette.primary, palette.secondary] as const,
      card: ['#FFFFFF', '#F8FAFC'] as const,
      background: ['#F5F3FF', '#FFFFFF', '#FDF2F8'] as const,
      button: [palette.primary, palette.secondary] as const,
      buttonDisabled: ['#D1D5DB', '#E5E7EB'] as const,
    },
    glass: 'rgba(255, 255, 255, 0.7)',
    shadow: 'rgba(139, 92, 246, 0.15)',
  },
  dark: {
    text: palette.darkText,
    textSecondary: palette.darkTextSecondary,
    background: palette.darkBackground,
    card: palette.darkCard,
    cardBorder: palette.darkCardBorder,
    input: palette.darkInput,
    tint: palette.primaryLight,
    primary: palette.primaryLight,
    secondary: palette.secondaryLight,
    icon: palette.darkTextSecondary,
    tabIconDefault: '#6B7280',
    tabIconSelected: palette.primaryLight,
    gradients: {
      primary: [palette.primary, palette.secondary] as const,
      card: ['#1A1A24', '#15151E'] as const, // Subtle gradient for dark cards
      background: ['#0B0B15', '#11111F', '#0B0B15'] as const,
      button: [palette.primary, palette.secondary] as const,
      buttonDisabled: ['#374151', '#4B5563'] as const,
    },
    glass: 'rgba(26, 26, 36, 0.8)',
    shadow: 'rgba(0, 0, 0, 0.5)',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

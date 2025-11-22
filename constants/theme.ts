/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Artemis Longevity Theme - Inspired by TrackFit
const primaryPurple = '#8B5CF6';
const lightPurple = '#A78BFA';
const darkPurple = '#7C3AED';

export const Colors = {
  light: {
    text: '#1F2937',
    background: '#FFFFFF',
    card: '#F9FAFB',
    tint: primaryPurple,
    primary: primaryPurple,
    secondary: lightPurple,
    accent: '#EC4899',
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: primaryPurple,
    border: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  dark: {
    text: '#F9FAFB',
    background: '#111827',
    card: '#1F2937',
    tint: lightPurple,
    primary: lightPurple,
    secondary: primaryPurple,
    accent: '#F472B6',
    icon: '#9CA3AF',
    tabIconDefault: '#6B7280',
    tabIconSelected: lightPurple,
    border: '#374151',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

import { useContext } from 'react';
import { ThemeContext } from './ThemeProvider';
import { colors, radii, spacing, fontFamily, shadow, motion } from './tokens';

export type Theme = {
  colors: typeof colors;
  radii: typeof radii;
  spacing: (n: number) => number;
  typography: {
    display: string; displayBold: string;
    body: string; bodyMedium: string; bodySemibold: string;
    accent: string; accentBold: string;
  };
  shadow: typeof shadow;
  motion: typeof motion;
};

export const defaultTheme: Theme = {
  colors,
  radii,
  spacing,
  typography: fontFamily,
  shadow,
  motion,
};

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}

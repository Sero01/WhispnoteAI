export const colors = {
  background: '#F4EDE0',
  surface: '#FFFFFF',
  ink: '#1F1B16',
  inkMuted: '#6B6358',
  accent: {
    sage: '#C7D9B5',
    lavender: '#D6CFE8',
    peach: '#F2C9B0',
    cream: '#F4EDE0',
  },
} as const;

export const radii = { sm: 8, md: 12, lg: 20, xl: 28, pill: 999 } as const;

export const spacing = (n: number) => n * 4;

export const fontFamily = {
  display: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  accent: 'Caveat_400Regular',
  accentBold: 'Caveat_700Bold',
} as const;

export const shadow = {
  card: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  pressed: { shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
} as const;

export const motion = { fast: 150, base: 220, slow: 360 } as const;

import { useMemo } from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { useTheme } from '@/theme/index';

export type TextVariant = 'display' | 'title' | 'body' | 'eyebrow' | 'handwritten';
export type TextColor = 'ink' | 'inkMuted' | 'background' | 'surface';

export type TextProps = Omit<RNTextProps, 'children'> & {
  variant?: TextVariant;
  color?: TextColor;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
};

const variantConfig: Record<TextVariant, { fontSize: number; lineHeight: number; letterSpacing: number; textTransform?: 'uppercase' }> = {
  display: { fontSize: 40, lineHeight: 44, letterSpacing: -0.5 },
  title: { fontSize: 22, lineHeight: 28, letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 24, letterSpacing: 0 },
  eyebrow: { fontSize: 11, lineHeight: 14, letterSpacing: 1.2, textTransform: 'uppercase' },
  handwritten: { fontSize: 18, lineHeight: 22, letterSpacing: 0 },
};

function resolveFontFamily(
  variant: TextVariant,
  weight: NonNullable<TextProps['weight']>,
  typography: ReturnType<typeof useTheme>['typography'],
): string {
  if (variant === 'display') return typography.displayBold;
  if (variant === 'handwritten') return typography.accent;
  if (variant === 'eyebrow') return typography.bodySemibold;
  if (variant === 'title') {
    if (weight === 'bold') return typography.displayBold;
    return typography.bodySemibold;
  }
  switch (weight) {
    case 'medium': return typography.bodyMedium;
    case 'semibold':
    case 'bold': return typography.bodySemibold;
    default: return typography.body;
  }
}

function resolveColor(color: NonNullable<TextProps['color']>, colors: ReturnType<typeof useTheme>['colors']): string {
  return colors[color];
}

export function Text({
  variant = 'body',
  color = 'ink',
  weight = 'regular',
  align = 'left',
  children,
  style,
  ...rest
}: TextProps): React.ReactElement {
  const theme = useTheme();

  const computedStyle = useMemo(() => {
    const config = variantConfig[variant];
    return [
      {
        fontFamily: resolveFontFamily(variant, weight, theme.typography),
        fontSize: config.fontSize,
        lineHeight: config.lineHeight,
        letterSpacing: config.letterSpacing,
        color: resolveColor(color, theme.colors),
        textAlign: align,
        textTransform: config.textTransform,
      },
      style,
    ];
  }, [theme, variant, color, weight, align, style]);

  return <RNText style={computedStyle} {...rest}>{children}</RNText>;
}

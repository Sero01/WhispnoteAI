import { useMemo } from 'react';
import { View, type ViewProps } from 'react-native';
import { useTheme } from '@/theme/index';

export type CardAccent = 'sage' | 'lavender' | 'peach' | 'cream' | 'surface';
export type CardSize = 'sm' | 'md' | 'lg';

export type CardProps = ViewProps & {
  accent?: CardAccent;
  size?: CardSize;
  bordered?: boolean;
  children: React.ReactNode;
};

const sizePaddingMap: Record<CardSize, (spacing: (n: number) => number) => number> = {
  sm: (s) => s(4),
  md: (s) => s(5),
  lg: (s) => s(6),
};

const sizeMinHeightMap: Record<CardSize, number> = {
  sm: 96,
  md: 140,
  lg: 200,
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function resolveBackground(accent: CardAccent, colors: ReturnType<typeof useTheme>['colors']): string {
  if (accent === 'surface') return colors.surface;
  return colors.accent[accent];
}

export function Card({
  accent = 'surface',
  size = 'md',
  bordered = false,
  children,
  style,
  ...rest
}: CardProps): React.ReactElement {
  const theme = useTheme();

  const computedStyle = useMemo(() => {
    const padding = sizePaddingMap[size](theme.spacing);
    const minHeight = sizeMinHeightMap[size];
    return [
      {
        borderRadius: theme.radii.xl,
        backgroundColor: resolveBackground(accent, theme.colors),
        padding,
        minHeight,
        ...theme.shadow.card,
        ...(bordered ? { borderWidth: 1, borderColor: hexToRgba(theme.colors.inkMuted, 0.3) } : {}),
      },
      style,
    ];
  }, [theme, accent, size, bordered, style]);

  return (
    <View style={computedStyle} {...rest}>
      {children}
    </View>
  );
}

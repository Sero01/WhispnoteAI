import { useMemo } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import { useTheme } from '@/theme/index';

export type IconButtonProps = Omit<PressableProps, 'children'> & {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'plain' | 'filled' | 'accent';
  accent?: 'sage' | 'lavender' | 'peach';
  accessibilityLabel: string;
  children: React.ReactNode;
};

const sizeMap: Record<string, number> = {
  sm: 32,
  md: 44,
  lg: 64,
};

export function IconButton({
  size = 'md',
  variant = 'plain',
  accent = 'sage',
  accessibilityLabel,
  children,
  style,
  ...rest
}: IconButtonProps): React.ReactElement {
  const theme = useTheme();

  const dim = sizeMap[size];

  const baseStyle = useMemo(() => {
    const bg = variant === 'filled'
      ? theme.colors.surface
      : variant === 'accent'
        ? theme.colors.accent[accent]
        : 'transparent';

    return {
      width: dim,
      height: dim,
      borderRadius: dim / 2,
      backgroundColor: bg,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      ...(variant !== 'plain' ? theme.shadow.pressed : {}),
    };
  }, [theme, variant, accent, dim]);

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        baseStyle,
        pressed && { transform: [{ scale: 0.95 }] },
        style as Record<string, unknown>,
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

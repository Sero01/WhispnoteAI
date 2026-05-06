import { useMemo } from 'react';
import { Pressable, ActivityIndicator, type PressableProps } from 'react-native';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme/index';

export type ButtonVariant = 'primary' | 'ghost' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'children'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  accent?: 'sage' | 'lavender' | 'peach';
  label: string;
  loading?: boolean;
  fullWidth?: boolean;
};

const sizeStyleMap: Record<ButtonSize, { height: number; paddingHorizontal: number }> = {
  sm: { height: 36, paddingHorizontal: 12 },
  md: { height: 44, paddingHorizontal: 16 },
  lg: { height: 56, paddingHorizontal: 24 },
};

function resolveLabelColor(variant: ButtonVariant): 'background' | 'ink' {
  return variant === 'primary' ? 'background' : 'ink';
}

function resolveBackground(variant: ButtonVariant, accent: NonNullable<ButtonProps['accent']>, colors: ReturnType<typeof useTheme>['colors']): string {
  if (variant === 'primary') return colors.ink;
  if (variant === 'accent') return colors.accent[accent];
  return 'transparent';
}

export function Button({
  variant = 'primary',
  size = 'md',
  accent = 'sage',
  label,
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: ButtonProps): React.ReactElement {
  const theme = useTheme();

  const baseStyle = useMemo(() => {
    const s = sizeStyleMap[size];
    return {
      height: s.height,
      paddingHorizontal: s.paddingHorizontal,
      borderRadius: theme.radii.pill,
      backgroundColor: resolveBackground(variant, accent, theme.colors),
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexDirection: 'row' as const,
      ...(variant === 'ghost' ? { borderWidth: 1, borderColor: theme.colors.ink } : {}),
      ...(fullWidth ? { alignSelf: 'stretch' as const } : {}),
    };
  }, [theme, variant, accent, size, fullWidth]);

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        baseStyle,
        pressed && { opacity: 0.85 },
        style as Record<string, unknown>,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={resolveLabelColor(variant) === 'background' ? theme.colors.background : theme.colors.ink} />
      ) : (
        <Text
          variant="body"
          weight="semibold"
          color={resolveLabelColor(variant)}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

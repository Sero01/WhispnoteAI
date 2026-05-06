import { useMemo } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme/index';

export type ChipVariant = 'filter' | 'tag';

export type ChipProps = Omit<PressableProps, 'children'> & {
  variant?: ChipVariant;
  selected?: boolean;
  accent?: 'sage' | 'lavender' | 'peach' | 'cream';
  label: string;
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function Chip({
  variant = 'filter',
  selected = false,
  accent = 'cream',
  label,
  style,
  ...rest
}: ChipProps): React.ReactElement {
  const theme = useTheme();

  const computedStyle = useMemo(() => {
    if (variant === 'filter') {
      return {
        height: 30,
        paddingHorizontal: 12,
        borderRadius: theme.radii.pill,
        backgroundColor: selected ? theme.colors.ink : theme.colors.surface,
        borderWidth: selected ? 0 : 1,
        borderColor: selected ? undefined : hexToRgba(theme.colors.inkMuted, 0.25),
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        flexDirection: 'row' as const,
      };
    }

    return {
      height: 30,
      paddingHorizontal: 12,
      borderRadius: theme.radii.pill,
      backgroundColor: theme.colors.accent[accent],
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexDirection: 'row' as const,
    };
  }, [theme, variant, selected, accent]);

  const labelColor = variant === 'filter' && selected ? 'background' : 'ink';
  const labelWeight = 'medium' as const;

  return (
    <Pressable
      style={({ pressed }) => [
        computedStyle,
        pressed && { opacity: 0.85 },
        style as Record<string, unknown>,
      ]}
      {...rest}
    >
      <Text variant="body" weight={labelWeight} color={labelColor}>
        {label}
      </Text>
    </Pressable>
  );
}

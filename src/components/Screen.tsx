import { useMemo } from 'react';
import { View, ScrollView, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/index';

export type ScreenProps = ViewProps & {
  background?: 'background' | 'surface';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  scroll?: boolean;
  children: React.ReactNode;
};

const paddingMap: Record<NonNullable<ScreenProps['padding']>, (spacing: (n: number) => number) => number> = {
  none: () => 0,
  sm: (s) => s(3),
  md: (s) => s(5),
  lg: (s) => s(8),
};

export function Screen({
  background = 'background',
  padding = 'md',
  scroll = false,
  children,
  style,
  ...rest
}: ScreenProps): React.ReactElement {
  const theme = useTheme();

  const containerStyle = useMemo(() => {
    const pad = paddingMap[padding](theme.spacing);
    return [
      {
        flex: 1,
        backgroundColor: theme.colors[background],
        paddingHorizontal: pad,
        paddingVertical: pad,
      },
      style,
    ];
  }, [theme, background, padding, style]);

  const content = scroll ? (
    <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing(8) }}>
      {children}
    </ScrollView>
  ) : (
    <View style={{ flex: 1 }}>{children}</View>
  );

  return (
    <SafeAreaView style={containerStyle} {...rest}>
      {content}
    </SafeAreaView>
  );
}

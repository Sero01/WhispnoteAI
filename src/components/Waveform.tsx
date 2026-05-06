import { useEffect, memo } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors as themeColors } from '@/theme/tokens';

const MAX_BARS = 64;
const ANIMATION_DURATION = 200;

const colorMap: Record<string, string> = {
  ink: themeColors.ink,
  sage: themeColors.accent.sage,
  lavender: themeColors.accent.lavender,
  peach: themeColors.accent.peach,
};

type BarProps = {
  amplitude: number;
  maxHeight: number;
  width: number;
  color: string;
};

const Bar = memo(function Bar({ amplitude, maxHeight, width, color }: BarProps) {
  const targetHeight = Math.max(2, amplitude * maxHeight);
  const svHeight = useSharedValue(targetHeight);

  useEffect(() => {
    svHeight.value = withTiming(targetHeight, { duration: ANIMATION_DURATION });
  }, [targetHeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: svHeight.value,
  }));

  return (
    <Animated.View
      style={[{
        width,
        backgroundColor: color,
        borderRadius: width / 2,
      }, animatedStyle]}
    />
  );
});

export type WaveformProps = {
  amplitudes: number[];
  color?: 'ink' | 'sage' | 'lavender' | 'peach';
  height?: number;
  barWidth?: number;
  barGap?: number;
  testID?: string;
};

export function Waveform({
  amplitudes,
  color = 'ink',
  height = 80,
  barWidth = 3,
  barGap = 4,
  testID,
}: WaveformProps): React.ReactElement {
  const sliced = amplitudes.slice(-MAX_BARS);
  const resolvedColor = colorMap[color];

  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        height,
        gap: barGap,
      }}
    >
      {sliced.map((amp, i) => (
        <Bar
          key={i}
          amplitude={amp}
          maxHeight={height}
          width={barWidth}
          color={resolvedColor}
        />
      ))}
    </View>
  );
}

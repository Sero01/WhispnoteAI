import { render, screen, fireEvent } from '@testing-library/react-native';
import { StyleSheet, type ViewStyle } from 'react-native';
import { View } from 'react-native';
import { IconButton } from '@/components/IconButton';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { defaultTheme } from '@/theme/index';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

function getStyle(element: unknown): ViewStyle {
  const el = element as { props?: { style?: unknown } };
  return StyleSheet.flatten(el.props?.style ?? {}) as ViewStyle;
}

const { colors } = defaultTheme;

describe('IconButton', () => {
  it('requires accessibilityLabel and renders it', () => {
    renderWithTheme(
      <IconButton accessibilityLabel="Add note">
        <View />
      </IconButton>,
    );
    expect(screen.getByLabelText('Add note')).toBeTruthy();
  });

  it('fires onPress when pressed', () => {
    const onPress = jest.fn();
    renderWithTheme(
      <IconButton accessibilityLabel="Press" onPress={onPress}>
        <View />
      </IconButton>,
    );
    fireEvent.press(screen.getByLabelText('Press'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders plain variant with transparent background', () => {
    renderWithTheme(
      <IconButton variant="plain" accessibilityLabel="Plain" testID="icon-btn">
        <View />
      </IconButton>,
    );
    const style = getStyle(screen.getByTestId('icon-btn'));
    expect(style.backgroundColor).toBe('transparent');
  });

  it('renders filled variant with surface background', () => {
    renderWithTheme(
      <IconButton variant="filled" accessibilityLabel="Filled" testID="icon-btn">
        <View />
      </IconButton>,
    );
    const style = getStyle(screen.getByTestId('icon-btn'));
    expect(style.backgroundColor).toBe(colors.surface);
  });

  it('renders accent variant with sage background by default', () => {
    renderWithTheme(
      <IconButton variant="accent" accessibilityLabel="Accent" testID="icon-btn">
        <View />
      </IconButton>,
    );
    const style = getStyle(screen.getByTestId('icon-btn'));
    expect(style.backgroundColor).toBe(colors.accent.sage);
  });

  it('renders accent variant with lavender background', () => {
    renderWithTheme(
      <IconButton variant="accent" accent="lavender" accessibilityLabel="Lavender" testID="icon-btn">
        <View />
      </IconButton>,
    );
    const style = getStyle(screen.getByTestId('icon-btn'));
    expect(style.backgroundColor).toBe(colors.accent.lavender);
  });

  it('renders accent variant with peach background', () => {
    renderWithTheme(
      <IconButton variant="accent" accent="peach" accessibilityLabel="Peach" testID="icon-btn">
        <View />
      </IconButton>,
    );
    const style = getStyle(screen.getByTestId('icon-btn'));
    expect(style.backgroundColor).toBe(colors.accent.peach);
  });

  it('renders sm size with dimensions 32', () => {
    renderWithTheme(
      <IconButton size="sm" accessibilityLabel="Small" testID="icon-btn">
        <View />
      </IconButton>,
    );
    const style = getStyle(screen.getByTestId('icon-btn'));
    expect(style.width).toBe(32);
    expect(style.height).toBe(32);
    expect(style.borderRadius).toBe(16);
  });

  it('renders md size with dimensions 44', () => {
    renderWithTheme(
      <IconButton size="md" accessibilityLabel="Medium" testID="icon-btn">
        <View />
      </IconButton>,
    );
    const style = getStyle(screen.getByTestId('icon-btn'));
    expect(style.width).toBe(44);
    expect(style.height).toBe(44);
    expect(style.borderRadius).toBe(22);
  });

  it('renders lg size with dimensions 64', () => {
    renderWithTheme(
      <IconButton size="lg" accessibilityLabel="Large" testID="icon-btn">
        <View />
      </IconButton>,
    );
    const style = getStyle(screen.getByTestId('icon-btn'));
    expect(style.width).toBe(64);
    expect(style.height).toBe(64);
    expect(style.borderRadius).toBe(32);
  });

  it('renders children', () => {
    renderWithTheme(
      <IconButton accessibilityLabel="With children">
        <View testID="child-icon" />
      </IconButton>,
    );
    expect(screen.getByTestId('child-icon')).toBeTruthy();
  });
});

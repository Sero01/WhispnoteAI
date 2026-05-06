import { render, screen, fireEvent } from '@testing-library/react-native';
import { StyleSheet, type ViewStyle } from 'react-native';
import { Button } from '@/components/Button';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { defaultTheme } from '@/theme/index';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

function getStyle(element: unknown): ViewStyle {
  const el = element as { props?: { style?: unknown } };
  return StyleSheet.flatten(el.props?.style ?? {}) as ViewStyle;
}

const { colors, radii } = defaultTheme;

describe('Button', () => {
  it('renders label text', () => {
    renderWithTheme(<Button label="Click me" />);
    expect(screen.getByText('Click me')).toBeTruthy();
  });

  it('renders primary variant with ink background and background label color', () => {
    renderWithTheme(<Button label="Primary" testID="btn" />);
    const style = getStyle(screen.getByTestId('btn'));
    expect(style.backgroundColor).toBe(colors.ink);
    expect(style.borderRadius).toBe(radii.pill);
  });

  it('renders ghost variant with 1px border', () => {
    renderWithTheme(<Button variant="ghost" label="Ghost" testID="btn" />);
    const style = getStyle(screen.getByTestId('btn'));
    expect(style.borderWidth).toBe(1);
    expect(style.borderColor).toBe(colors.ink);
    expect(style.backgroundColor).toBe('transparent');
  });

  it('renders accent variant with sage background', () => {
    renderWithTheme(<Button variant="accent" accent="sage" label="Accent" testID="btn" />);
    const style = getStyle(screen.getByTestId('btn'));
    expect(style.backgroundColor).toBe(colors.accent.sage);
  });

  it('renders accent variant with lavender background', () => {
    renderWithTheme(<Button variant="accent" accent="lavender" label="Accent" testID="btn" />);
    const style = getStyle(screen.getByTestId('btn'));
    expect(style.backgroundColor).toBe(colors.accent.lavender);
  });

  it('renders accent variant with peach background', () => {
    renderWithTheme(<Button variant="accent" accent="peach" label="Accent" testID="btn" />);
    const style = getStyle(screen.getByTestId('btn'));
    expect(style.backgroundColor).toBe(colors.accent.peach);
  });

  it('renders loading state with ActivityIndicator and disables press', () => {
    const onPress = jest.fn();
    renderWithTheme(<Button label="Loading" loading onPress={onPress} testID="btn" />);
    expect(screen.queryByText('Loading')).toBeNull();
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('fires onPress when pressed', () => {
    const onPress = jest.fn();
    renderWithTheme(<Button label="Press me" onPress={onPress} />);
    fireEvent.press(screen.getByText('Press me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders fullWidth with alignSelf stretch', () => {
    renderWithTheme(<Button label="Full" fullWidth testID="btn" />);
    const style = getStyle(screen.getByTestId('btn'));
    expect(style.alignSelf).toBe('stretch');
  });

  it('renders sm size with height 36', () => {
    renderWithTheme(<Button size="sm" label="Small" testID="btn" />);
    const style = getStyle(screen.getByTestId('btn'));
    expect(style.height).toBe(36);
  });

  it('renders md size with height 44', () => {
    renderWithTheme(<Button size="md" label="Medium" testID="btn" />);
    const style = getStyle(screen.getByTestId('btn'));
    expect(style.height).toBe(44);
  });

  it('renders lg size with height 56', () => {
    renderWithTheme(<Button size="lg" label="Large" testID="btn" />);
    const style = getStyle(screen.getByTestId('btn'));
    expect(style.height).toBe(56);
  });
});

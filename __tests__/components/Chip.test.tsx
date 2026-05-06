import { render, screen, fireEvent } from '@testing-library/react-native';
import { StyleSheet, type ViewStyle } from 'react-native';
import { Chip } from '@/components/Chip';
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

describe('Chip', () => {
  it('renders label text', () => {
    renderWithTheme(<Chip label="Tag" />);
    expect(screen.getByText('Tag')).toBeTruthy();
  });

  it('renders filter variant unselected with surface background and 1px border', () => {
    renderWithTheme(<Chip label="Filter" testID="chip" />);
    const style = getStyle(screen.getByTestId('chip'));
    expect(style.backgroundColor).toBe(colors.surface);
    expect(style.borderWidth).toBe(1);
    expect(style.borderColor).toBeDefined();
  });

  it('renders filter selected with ink background', () => {
    renderWithTheme(<Chip variant="filter" selected label="Selected" testID="chip" />);
    const style = getStyle(screen.getByTestId('chip'));
    expect(style.backgroundColor).toBe(colors.ink);
    expect(style.borderWidth).toBe(0);
  });

  it('renders tag variant with cream background by default', () => {
    renderWithTheme(<Chip variant="tag" label="Tag" testID="chip" />);
    const style = getStyle(screen.getByTestId('chip'));
    expect(style.backgroundColor).toBe(colors.accent.cream);
  });

  it('renders tag variant with sage background', () => {
    renderWithTheme(<Chip variant="tag" accent="sage" label="Tag" testID="chip" />);
    const style = getStyle(screen.getByTestId('chip'));
    expect(style.backgroundColor).toBe(colors.accent.sage);
  });

  it('renders tag variant with lavender background', () => {
    renderWithTheme(<Chip variant="tag" accent="lavender" label="Tag" testID="chip" />);
    const style = getStyle(screen.getByTestId('chip'));
    expect(style.backgroundColor).toBe(colors.accent.lavender);
  });

  it('renders tag variant with peach background', () => {
    renderWithTheme(<Chip variant="tag" accent="peach" label="Tag" testID="chip" />);
    const style = getStyle(screen.getByTestId('chip'));
    expect(style.backgroundColor).toBe(colors.accent.peach);
  });

  it('applies pill border radius and height 30', () => {
    renderWithTheme(<Chip label="Chip" testID="chip" />);
    const style = getStyle(screen.getByTestId('chip'));
    expect(style.borderRadius).toBe(radii.pill);
    expect(style.height).toBe(30);
  });

  it('fires onPress when pressed', () => {
    const onPress = jest.fn();
    renderWithTheme(<Chip label="Press" onPress={onPress} />);
    fireEvent.press(screen.getByText('Press'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

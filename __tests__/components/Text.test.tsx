import { render, screen } from '@testing-library/react-native';
import { StyleSheet, type TextStyle } from 'react-native';
import { Text } from '@/components/Text';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { defaultTheme } from '@/theme/index';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

function getStyle(element: unknown): TextStyle {
  const el = element as { props?: { style?: unknown } };
  return StyleSheet.flatten(el.props?.style ?? {}) as TextStyle;
}

const { colors, typography } = defaultTheme;

describe('Text', () => {
  it('renders default (body) with theme.colors.ink and Inter_400Regular', () => {
    renderWithTheme(<Text>Hello</Text>);
    const style = getStyle(screen.getByText('Hello'));
    expect(style.color).toBe(colors.ink);
    expect(style.fontFamily).toBe(typography.body);
    expect(style.fontSize).toBe(16);
  });

  it('renders variant="display" with display font and size 40', () => {
    renderWithTheme(<Text variant="display">Display</Text>);
    const style = getStyle(screen.getByText('Display'));
    expect(style.fontFamily).toBe(typography.displayBold);
    expect(style.fontSize).toBe(40);
  });

  it('renders variant="handwritten" with accent font', () => {
    renderWithTheme(<Text variant="handwritten">Handwritten</Text>);
    const style = getStyle(screen.getByText('Handwritten'));
    expect(style.fontFamily).toBe(typography.accent);
    expect(style.fontSize).toBe(18);
  });

  it('renders variant="eyebrow" with textTransform: uppercase', () => {
    renderWithTheme(<Text variant="eyebrow">eyebrow text</Text>);
    const style = getStyle(screen.getByText('eyebrow text'));
    expect(style.textTransform).toBe('uppercase');
    expect(style.fontFamily).toBe(typography.bodySemibold);
    expect(style.fontSize).toBe(11);
  });

  it('renders color="inkMuted" and applies the muted color value', () => {
    renderWithTheme(<Text color="inkMuted">Muted</Text>);
    const style = getStyle(screen.getByText('Muted'));
    expect(style.color).toBe(colors.inkMuted);
  });

  it('throws when used outside ThemeProvider', () => {
    expect(() => render(<Text>Oops</Text>)).toThrow(/ThemeProvider|useTheme/);
  });
});

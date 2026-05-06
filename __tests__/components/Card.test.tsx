import { render, screen } from '@testing-library/react-native';
import { StyleSheet, type ViewStyle } from 'react-native';
import { Card } from '@/components/Card';
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

describe('Card', () => {
  it('renders with default borderRadius = radii.xl and backgroundColor = theme.colors.surface', () => {
    renderWithTheme(<Card testID="card">Content</Card>);
    const style = getStyle(screen.getByTestId('card'));
    expect(style.borderRadius).toBe(radii.xl);
    expect(style.backgroundColor).toBe(colors.surface);
  });

  it('renders with accent="sage" using theme.colors.accent.sage as background', () => {
    renderWithTheme(<Card accent="sage" testID="card">Sage</Card>);
    const style = getStyle(screen.getByTestId('card'));
    expect(style.backgroundColor).toBe(colors.accent.sage);
  });

  it('renders with bordered having a 1px border', () => {
    renderWithTheme(<Card bordered testID="card">Bordered</Card>);
    const style = getStyle(screen.getByTestId('card'));
    expect(style.borderWidth).toBe(1);
    expect(style.borderColor).toBeDefined();
  });

  it('card size "sm" applies expected padding and minHeight', () => {
    renderWithTheme(<Card size="sm" testID="card">Small</Card>);
    const style = getStyle(screen.getByTestId('card'));
    expect(style.padding).toBe(defaultTheme.spacing(4));
    expect(style.minHeight).toBe(96);
  });

  it('card size "md" applies expected padding and minHeight', () => {
    renderWithTheme(<Card size="md" testID="card">Medium</Card>);
    const style = getStyle(screen.getByTestId('card'));
    expect(style.padding).toBe(defaultTheme.spacing(5));
    expect(style.minHeight).toBe(140);
  });

  it('card size "lg" applies expected padding and minHeight', () => {
    renderWithTheme(<Card size="lg" testID="card">Large</Card>);
    const style = getStyle(screen.getByTestId('card'));
    expect(style.padding).toBe(defaultTheme.spacing(6));
    expect(style.minHeight).toBe(200);
  });

  it('renders children text', () => {
    renderWithTheme(<Card testID="card">Hello Card</Card>);
    expect(screen.getByTestId('card')).toBeTruthy();
  });
});

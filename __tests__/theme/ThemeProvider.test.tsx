import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useTheme } from '@/theme/index';

function ThemeConsumer() {
  const theme = useTheme();
  return (
    <>
      <Text>{theme.colors.ink}</Text>
      <Text>{theme.typography.body}</Text>
    </>
  );
}

describe('ThemeProvider', () => {
  it('provides default theme to consumers', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );
    expect(screen.getByText('#1F1B16')).toBeTruthy();
    expect(screen.getByText('Inter_400Regular')).toBeTruthy();
  });

  it('throws when useTheme is used outside provider', () => {
    expect(() => render(<ThemeConsumer />)).toThrow(/ThemeProvider.*useTheme|useTheme.*ThemeProvider/);
  });
});
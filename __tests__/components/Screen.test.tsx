import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Screen } from '@/components/Screen';
import { ThemeProvider } from '@/theme/ThemeProvider';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('Screen', () => {
  it('renders children inside SafeAreaView', () => {
    const { getByTestId } = renderWithTheme(
      <Screen testID="screen">
        <Text testID="child">Hello</Text>
      </Screen>,
    );
    expect(getByTestId('screen')).toBeTruthy();
    expect(getByTestId('child')).toBeTruthy();
  });

  it('applies background="surface" when set', () => {
    const { getByTestId } = renderWithTheme(
      <Screen background="surface" testID="screen-root">
        <Text>Hello</Text>
      </Screen>,
    );
    expect(getByTestId('screen-root')).toBeTruthy();
  });

  it('wraps in ScrollView when scroll is true', () => {
    const { getByTestId } = renderWithTheme(
      <Screen scroll testID="screen">
        <Text testID="child">Scrollable</Text>
      </Screen>,
    );
    expect(getByTestId('child')).toBeTruthy();
  });
});

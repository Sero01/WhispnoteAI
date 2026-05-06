import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';

describe('nativewind smoke', () => {
  it('renders a className-tagged View without throwing', () => {
    const { getByText } = render(
      <View className="bg-[#F4EDE0] p-4">
        <Text>ok</Text>
      </View>
    );
    expect(getByText('ok')).toBeTruthy();
  });
});

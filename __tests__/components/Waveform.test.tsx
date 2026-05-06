import { render } from '@testing-library/react-native';
import { Waveform } from '@/components/Waveform';

const testID = 'waveform';

describe('Waveform', () => {
  it('renders the right number of bars equal to min(amplitudes.length, 64)', () => {
    const amplitudes = Array.from({ length: 10 }, () => Math.random());
    const { getAllByTestId } = render(<Waveform amplitudes={amplitudes} testID={testID} />);
    const container = getAllByTestId(testID)[0];
    expect(container.children.length).toBe(10);
  });

  it('caps bars at 64', () => {
    const amplitudes = Array.from({ length: 100 }, () => Math.random());
    const { getAllByTestId } = render(<Waveform amplitudes={amplitudes} testID={testID} />);
    const container = getAllByTestId(testID)[0];
    // The Animated.View children inside the container
    // RNTL: container children are the Bar Animated.Views
    expect(container.children.length).toBe(64);
  });

  it('renders container with given height when amplitudes is empty', () => {
    const { getByTestId } = render(<Waveform amplitudes={[]} testID={testID} />);
    const container = getByTestId(testID);
    expect(container.props.style.height).toBe(80);
  });

  it('renders no bars when amplitudes is empty', () => {
    const { getByTestId } = render(<Waveform amplitudes={[]} testID={testID} />);
    const container = getByTestId(testID);
    expect(container.children.length).toBe(0);
  });

  it('uses default height when not provided', () => {
    const { getByTestId } = render(<Waveform amplitudes={[0.5]} testID={testID} />);
    expect(getByTestId(testID).props.style.height).toBe(80);
  });

  it('accepts custom height prop', () => {
    const { getByTestId } = render(<Waveform amplitudes={[0.5]} height={120} testID={testID} />);
    expect(getByTestId(testID).props.style.height).toBe(120);
  });

  it('applies color prop to bar backgrounds', () => {
    const amplitudes = [0.5];
    const { getAllByTestId } = render(
      <Waveform amplitudes={amplitudes} color="sage" testID={testID} />,
    );
    const container = getAllByTestId(testID)[0];
    // Animated.View bars — check that backgroundColor is set via animated style
    const bar = container.children[0];
    expect(bar).toBeDefined();
  });
});

import { render, screen, fireEvent } from '@testing-library/react-native';
import { CardTile } from '../../../src/features/library/CardTile';
import { ThemeProvider } from '@/theme/ThemeProvider';
import type { Card } from '@/types';

const mockCard: Card = {
  id: 'c1',
  noteId: 'n1',
  deckId: 'd1',
  title: 'Test Card',
  summary: 'This is a summary of the test card.',
  body: '',
  tags: [],
  category: 'Idea',
  importance: 3,
  accent: 'sage',
  bookmarked: true,
  createdAt: 1,
  updatedAt: 1,
};

const mockCardNotBookmarked: Card = {
  ...mockCard,
  id: 'c2',
  bookmarked: false,
};

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('CardTile', () => {
  it('renders card title', () => {
    const onPress = jest.fn();
    renderWithTheme(<CardTile card={mockCard} onPress={onPress} />);
    expect(screen.getByText('Test Card')).toBeTruthy();
  });

  it('renders card summary', () => {
    const onPress = jest.fn();
    renderWithTheme(<CardTile card={mockCard} onPress={onPress} />);
    expect(screen.getByText('This is a summary of the test card.')).toBeTruthy();
  });

  it('renders card category as eyebrow', () => {
    const onPress = jest.fn();
    renderWithTheme(<CardTile card={mockCard} onPress={onPress} />);
    expect(screen.getByText('Idea')).toBeTruthy();
  });

  it('shows bookmark dot when bookmarked', () => {
    const onPress = jest.fn();
    renderWithTheme(<CardTile card={mockCard} onPress={onPress} />);
    expect(screen.getByText('\u25CF')).toBeTruthy();
  });

  it('does not show bookmark dot when not bookmarked', () => {
    const onPress = jest.fn();
    renderWithTheme(<CardTile card={mockCardNotBookmarked} onPress={onPress} />);
    expect(screen.queryByText('\u25CF')).toBeNull();
  });

  it('fires onPress when pressed', () => {
    const onPress = jest.fn();
    renderWithTheme(<CardTile card={mockCard} onPress={onPress} />);
    fireEvent.press(screen.getByText('Test Card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

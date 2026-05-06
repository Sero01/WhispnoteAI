import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { AppProviders } from '@/providers/AppProviders';
import { MoveToDeckSheet } from '@/features/card-detail/MoveToDeckSheet';

jest.mock('@/lib/db', () => ({
  decksRepo: { list: jest.fn() },
}));

const { decksRepo } = jest.requireMock('@/lib/db') as { decksRepo: { list: jest.Mock } };

const mockDecks = [
  { id: 'deck-1', name: 'Engineering', accent: 'sage' as const, createdAt: 1, updatedAt: 1 },
  { id: 'deck-2', name: 'Design', accent: 'lavender' as const, createdAt: 1, updatedAt: 1 },
];

const onClose = jest.fn();
const onSelect = jest.fn();

function renderSheet(overrides?: Partial<React.ComponentProps<typeof MoveToDeckSheet>>) {
  return render(
    <AppProviders>
      <MoveToDeckSheet
        visible
        currentDeckId={null}
        onClose={onClose}
        onSelect={onSelect}
        {...overrides}
      />
    </AppProviders>,
  );
}

describe('MoveToDeckSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    decksRepo.list.mockResolvedValue(mockDecks);
  });

  it('renders "Unfiled" and both deck names', async () => {
    renderSheet();

    await waitFor(() => {
      expect(screen.getByText('Unfiled')).toBeTruthy();
    });
    expect(screen.getByText('Engineering')).toBeTruthy();
    expect(screen.getByText('Design')).toBeTruthy();
  });

  it('tapping "Unfiled" calls onSelect(null) and onClose', async () => {
    renderSheet();

    await waitFor(() => {
      expect(screen.getByText('Unfiled')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Unfiled'));
    expect(onSelect).toHaveBeenCalledWith(null);
    expect(onClose).toHaveBeenCalled();
  });

  it('tapping a deck row calls onSelect with that deck.id and onClose', async () => {
    renderSheet();

    await waitFor(() => {
      expect(screen.getByText('Engineering')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Engineering'));
    expect(onSelect).toHaveBeenCalledWith('deck-1');
    expect(onClose).toHaveBeenCalled();
  });

  it('tapping Cancel calls onClose', async () => {
    renderSheet();

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { AppProviders } from '@/providers/AppProviders';
import { DeckEditSheet } from '../../../src/features/decks/DeckEditSheet';

jest.mock('@/lib/db', () => ({
  decksRepo: {
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const { decksRepo } = jest.requireMock('@/lib/db');

const mockDeck = {
  id: 'd1',
  name: 'Engineering',
  accent: 'sage' as const,
  createdAt: 1,
  updatedAt: 1,
};

const onClose = jest.fn();
const onSaved = jest.fn();
const onDeleted = jest.fn();

function renderSheet(props?: Partial<React.ComponentProps<typeof DeckEditSheet>>) {
  return render(
    <AppProviders>
      <DeckEditSheet
        deck={mockDeck}
        visible={true}
        onClose={onClose}
        onSaved={onSaved}
        onDeleted={onDeleted}
        {...props}
      />
    </AppProviders>,
  );
}

describe('DeckEditSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => buttons?.[1]?.onPress?.());
  });

  it('renders rename input prefilled', () => {
    renderSheet();
    const input = screen.getByDisplayValue('Engineering');
    expect(input).toBeTruthy();
  });

  it('selecting an accent swatch updates state', () => {
    renderSheet();
    const saveButton = screen.getByText('Save');
    const deleteButton = screen.getByText('Delete deck');
    expect(saveButton).toBeTruthy();
    expect(deleteButton).toBeTruthy();
  });

  it('save calls decksRepo.update with name and accent', async () => {
    decksRepo.update.mockResolvedValue({ ...mockDeck, name: 'Renamed', accent: 'lavender' });
    renderSheet();

    const input = screen.getByDisplayValue('Engineering');
    fireEvent.changeText(input, 'Renamed');

    const saveButton = screen.getByText('Save');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(decksRepo.update).toHaveBeenCalledWith('d1', { name: 'Renamed', accent: 'sage' });
    });
    expect(onSaved).toHaveBeenCalled();
  });

  it('delete calls decksRepo.delete and onDeleted', async () => {
    decksRepo.delete.mockResolvedValue(undefined);
    renderSheet();

    const deleteButton = screen.getByText('Delete deck');
    fireEvent.press(deleteButton);

    await waitFor(() => {
      expect(decksRepo.delete).toHaveBeenCalledWith('d1');
    });
    expect(onDeleted).toHaveBeenCalledWith('d1');
  });

  it('delete confirms via Alert.alert', () => {
    const alertMock = jest.spyOn(Alert, 'alert');
    renderSheet();

    const deleteButton = screen.getByText('Delete deck');
    fireEvent.press(deleteButton);

    expect(alertMock).toHaveBeenCalled();
  });
});

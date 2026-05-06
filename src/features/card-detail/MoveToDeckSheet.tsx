import { Modal, View, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Card, Text, Button } from '@/components';
import { useTheme } from '@/theme';
import { decksRepo } from '@/lib/db';
import type { Deck } from '@/types';

type Props = {
  visible: boolean;
  currentDeckId: string | null;
  onClose: () => void;
  onSelect: (deckId: string | null) => void;
};

export function MoveToDeckSheet(props: Props): React.ReactElement {
  const { visible, currentDeckId, onClose, onSelect } = props;
  const theme = useTheme();

  const { data: decks, isLoading } = useQuery({
    queryKey: ['decks'],
    queryFn: () => decksRepo.list(),
  });

  const handleSelect = (deckId: string | null) => {
    onSelect(deckId);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.3)',
        }}
      >
        <View style={{ padding: theme.spacing(5), paddingBottom: theme.spacing(8) }}>
          <Card accent="surface" size="lg" style={{ gap: theme.spacing(4) }}>
            <Text variant="title" align="center">
              Move to deck
            </Text>

            {isLoading ? (
              <ActivityIndicator color={theme.colors.ink} />
            ) : (
              <View style={{ gap: theme.spacing(1) }}>
                <Pressable
                  onPress={() => handleSelect(null)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: theme.spacing(2),
                    paddingHorizontal: theme.spacing(2),
                    borderRadius: theme.radii.md,
                    backgroundColor: pressed ? theme.colors.accent.cream : 'transparent',
                  })}
                >
                  <Text
                    variant="body"
                    weight={currentDeckId === null ? 'semibold' : 'regular'}
                  >
                    Unfiled
                  </Text>
                  {currentDeckId === null && (
                    <Text variant="body" weight="semibold" color="inkMuted">✓</Text>
                  )}
                </Pressable>

                {(decks ?? []).map((deck: Deck) => {
                  const isSelected = deck.id === currentDeckId;
                  return (
                    <Pressable
                      key={deck.id}
                      onPress={() => handleSelect(deck.id)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: theme.spacing(2),
                        paddingHorizontal: theme.spacing(2),
                        borderRadius: theme.radii.md,
                        backgroundColor: pressed ? theme.colors.accent.cream : 'transparent',
                      })}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2) }}>
                        <View
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: theme.colors.accent[deck.accent],
                          }}
                        />
                        <Text variant="body" weight={isSelected ? 'semibold' : 'regular'}>
                          {deck.name}
                        </Text>
                      </View>
                      {isSelected && (
                        <Text variant="body" weight="semibold" color="inkMuted">✓</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}

            <Button variant="ghost" label="Cancel" onPress={onClose} fullWidth />
          </Card>
        </View>
      </View>
    </Modal>
  );
}

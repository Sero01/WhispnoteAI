import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Screen, Text, Card, Button, IconButton } from '@/components';
import { useTheme } from '@/theme';
import { useDeckWithCards } from '@/features/decks/useDeckWithCards';
import { DeckEditSheet } from '@/features/decks/DeckEditSheet';
import type { Deck } from '@/types';

export default function DeckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { deck, cards, isLoading } = useDeckWithCards(id);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [localDeck, setLocalDeck] = useState<Deck | null | undefined>(undefined);

  const displayDeck = localDeck !== undefined ? localDeck : deck;

  const handleSaved = (updated: Deck) => {
    setLocalDeck(updated);
    queryClient.invalidateQueries({ queryKey: ['deck', id] });
    queryClient.invalidateQueries({ queryKey: ['decks'] });
  };

  const handleDeleted = () => {
    router.replace('/decks');
  };

  return (
    <Screen scroll padding="md">
      <Stack.Screen options={{ headerShown: false }} />

      {!isLoading && displayDeck === null ? (
        <View style={{ gap: theme.spacing(5), alignItems: 'center', paddingTop: theme.spacing(12) }}>
          <Card accent="peach" size="md" style={{ alignItems: 'center', gap: theme.spacing(3), width: '100%' }}>
            <Text variant="title" align="center">
              This deck no longer exists.
            </Text>
            <Button label="Back" variant="primary" onPress={() => router.back()} />
          </Card>
        </View>
      ) : (
        <View style={{ gap: theme.spacing(5) }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: theme.spacing(2) }}>
            <View style={{ flex: 1, gap: theme.spacing(2) }}>
              <Text variant="display">{displayDeck?.name ?? '...'}</Text>
              {cards && (
                <Text variant="eyebrow" color="inkMuted">
                  {cards.length} {cards.length === 1 ? 'card' : 'cards'}
                </Text>
              )}
            </View>
            <IconButton
              accessibilityLabel="Edit deck"
              variant="filled"
              size="md"
              onPress={() => setSheetVisible(true)}
            >
              <Text variant="body" color="ink">
                ...
              </Text>
            </IconButton>
          </View>

          {displayDeck && (
            <DeckEditSheet
              deck={displayDeck}
              visible={sheetVisible}
              onClose={() => setSheetVisible(false)}
              onSaved={handleSaved}
              onDeleted={handleDeleted}
            />
          )}

          {!isLoading && cards && cards.length === 0 ? (
            <Text variant="handwritten" color="inkMuted">
              No cards in this deck yet.
            </Text>
          ) : (
            <View style={{ gap: theme.spacing(3) }}>
              {cards?.map((card) => (
                <Pressable
                  key={card.id}
                  onPress={() => router.push('/card/' + card.id)}
                >
                  <Card accent={card.accent} size="md">
                    <View style={{ gap: theme.spacing(2) }}>
                      <Text variant="title">{card.title}</Text>
                      <Text variant="body" color="inkMuted">
                        {card.summary}
                      </Text>
                    </View>
                  </Card>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}

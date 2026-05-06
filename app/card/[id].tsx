import { useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Screen, Text, Card, Button, IconButton, Chip } from '@/components';
import { useTheme } from '@/theme';
import { useCard } from '@/features/card-detail/useCard';
import { MoveToDeckSheet } from '@/features/card-detail/MoveToDeckSheet';
import { cardsRepo, decksRepo } from '@/lib/db';

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { data: card, isLoading } = useCard(id);
  const [moveSheetVisible, setMoveSheetVisible] = useState(false);

  const { data: deckData } = useQuery({
    queryKey: ['deck', card?.deckId],
    queryFn: () => decksRepo.get(card!.deckId!),
    enabled: !!card?.deckId,
  });

  const deckName = card?.deckId ? (deckData?.name ?? 'unfiled') : 'unfiled';

  const handleBookmark = async () => {
    if (!card) return;
    await cardsRepo.setBookmarked(card.id, !card.bookmarked);
    queryClient.invalidateQueries({ queryKey: ['card', card.id] });
    queryClient.invalidateQueries({ queryKey: ['cards'] });
  };

  const handleDelete = () => {
    if (!card) return;
    Alert.alert('Delete card?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  };

  const doDelete = async () => {
    if (!card) return;
    await cardsRepo.delete(card.id);
    queryClient.invalidateQueries({ queryKey: ['cards'] });
    queryClient.invalidateQueries({ queryKey: ['decks-with-count'] });
    router.replace('/');
  };

  const handleMove = async (deckId: string | null) => {
    if (!card) return;
    await cardsRepo.update(card.id, { deckId });
    queryClient.invalidateQueries({ queryKey: ['card', card.id] });
    queryClient.invalidateQueries({ queryKey: ['cards'] });
    queryClient.invalidateQueries({ queryKey: ['deck', card.deckId] });
    if (deckId) queryClient.invalidateQueries({ queryKey: ['deck', deckId] });
    queryClient.invalidateQueries({ queryKey: ['decks-with-count'] });
  };

  const bodyParagraphs = card?.body
    ? card.body.split(/\n\n+/).map((p) => p.trim()).filter((p) => p.length > 0)
    : [];

  return (
    <>
    <Screen scroll padding="md">
      <Stack.Screen options={{ headerShown: false }} />

      {isLoading && card === undefined ? (
        <Text variant="eyebrow" align="center" color="inkMuted">Loading…</Text>
      ) : !isLoading && card === null ? (
        <Card accent="peach" size="md" style={{ alignItems: 'center', gap: theme.spacing(3), width: '100%' }}>
          <Text variant="title" align="center">This card no longer exists.</Text>
          <Button label="Back" variant="primary" onPress={() => router.back()} />
        </Card>
      ) : card ? (
        <View style={{ gap: theme.spacing(5) }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: theme.spacing(2) }}>
            <View style={{ flex: 1, gap: theme.spacing(2) }}>
              <Text variant="eyebrow" color="inkMuted">{card.category} · importance {card.importance}</Text>
              <Text variant="display">{card.title}</Text>
            </View>
            <View style={{ gap: theme.spacing(2), alignItems: 'center' }}>
              <IconButton
                accessibilityLabel="Toggle bookmark"
                variant={card.bookmarked ? 'filled' : 'plain'}
                onPress={handleBookmark}
              >
                <Text variant="body" color="ink">{card.bookmarked ? '★' : '☆'}</Text>
              </IconButton>
              <IconButton
                accessibilityLabel="Delete card"
                variant="plain"
                onPress={handleDelete}
              >
                <Text>×</Text>
              </IconButton>
            </View>
          </View>

          <Text variant="handwritten" color="inkMuted">{card.summary}</Text>

          <Pressable onPress={() => setMoveSheetVisible(true)}>
            <Text variant="eyebrow" color="inkMuted">in {deckName}</Text>
          </Pressable>

          {bodyParagraphs.length > 0 && (
            <View style={{ gap: theme.spacing(3) }}>
              {bodyParagraphs.map((p, i) => (
                <Text key={i} variant="body">{p}</Text>
              ))}
            </View>
          )}

          {card.tags.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(2) }}>
              {card.tags.map((tag) => (
                <Chip key={tag} variant="tag" label={tag} />
              ))}
            </View>
          )}
        </View>
      ) : null}
    </Screen>

      <MoveToDeckSheet
        visible={moveSheetVisible}
        currentDeckId={card?.deckId ?? null}
        onClose={() => setMoveSheetVisible(false)}
        onSelect={handleMove}
      />
    </>
  );
}

import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Card } from '@/components';
import { useTheme } from '@/theme';
import { useDecksWithCount } from '@/features/decks/useDecksWithCount';

export default function DecksScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { data: decks, isLoading } = useDecksWithCount();

  return (
    <Screen scroll padding="md">
      <View style={{ gap: theme.spacing(5) }}>
        <Text variant="display">Decks</Text>

        {!isLoading && (!decks || decks.length === 0) ? (
          <Text variant="handwritten" color="inkMuted">
            No decks yet — record your first note.
          </Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(3) }}>
            {decks?.map((deck) => (
              <Pressable
                key={deck.id}
                onPress={() => router.push('/deck/' + deck.id)}
                style={{ width: '47%' }}
              >
                <Card accent={deck.accent} size="md">
                  <View style={{ gap: theme.spacing(2) }}>
                    <Text variant="title">{deck.name}</Text>
                    <Text variant="body" color="inkMuted">
                      {deck.cardCount} {deck.cardCount === 1 ? 'card' : 'cards'}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

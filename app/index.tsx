import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Chip, Button } from '@/components';
import { useCards } from '@/features/library/useCards';
import { useCategories } from '@/features/library/useCategories';
import { CardTile } from '@/features/library/CardTile';

export default function Index() {
  const router = useRouter();
  const [tab, setTab] = useState<'recent' | 'bookmarked'>('recent');
  const [category, setCategory] = useState<string | null>(null);

  const { data: categories } = useCategories();

  const filter = tab === 'bookmarked'
    ? { bookmarked: true, ...(category ? { category } : {}) }
    : category ? { category } : undefined;

  const { data: cards, isLoading } = useCards(filter);

  const todaysDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const chips = ['All', ...(categories ?? [])];

  const leftCards = cards?.filter((_, i) => i % 2 === 0) ?? [];
  const rightCards = cards?.filter((_, i) => i % 2 === 1) ?? [];

  return (
    <Screen scroll>
      <View style={{ gap: 20 }}>
        <View style={{ gap: 4 }}>
          <Text variant="display">My Notes</Text>
          <Text variant="handwritten" color="inkMuted">
            {todaysDate}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip
            variant="filter"
            selected={tab === 'recent'}
            label="Recent"
            onPress={() => setTab('recent')}
          />
          <Chip
            variant="filter"
            selected={tab === 'bookmarked'}
            label="Bookmarked"
            onPress={() => setTab('bookmarked')}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {chips.map((cat) => (
              <Chip
                key={cat}
                variant="filter"
                selected={(cat === 'All' && !category) || cat === category}
                label={cat}
                onPress={() => setCategory(cat === 'All' ? null : cat)}
              />
            ))}
          </View>
        </ScrollView>

        {!isLoading && (!cards || cards.length === 0) ? (
          <Text variant="handwritten" color="inkMuted">
            Your notes will appear here. Tap the mic to capture one.
          </Text>
        ) : (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, gap: 12 }}>
              {leftCards.map((card) => (
                <CardTile
                  key={card.id}
                  card={card}
                  onPress={() => router.push('/card/' + card.id)}
                />
              ))}
            </View>
            <View style={{ flex: 1, gap: 12 }}>
              {rightCards.map((card) => (
                <CardTile
                  key={card.id}
                  card={card}
                  onPress={() => router.push('/card/' + card.id)}
                />
              ))}
            </View>
          </View>
        )}

        <Button
          variant="accent"
          accent="peach"
          size="lg"
          fullWidth
          label="Record a note"
          onPress={() => router.push('/record')}
        />
      </View>
    </Screen>
  );
}

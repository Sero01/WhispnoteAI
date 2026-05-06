import { View, Pressable } from 'react-native';
import { Card, Text } from '@/components';
import type { CardSize } from '@/components';
import type { Card as CardType } from '@/types';

type CardTileProps = { card: CardType; onPress: () => void };

function importanceToSize(importance: number): CardSize {
  if (importance <= 2) return 'sm';
  if (importance === 3) return 'md';
  return 'lg';
}

export function CardTile({ card, onPress }: CardTileProps): React.ReactElement {
  return (
    <Pressable onPress={onPress}>
      <Card accent={card.accent} size={importanceToSize(card.importance)}>
        <View style={{ gap: 6 }}>
          <Text variant="title">{card.title}</Text>
          <Text variant="body" color="inkMuted" numberOfLines={3}>
            {card.summary}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="eyebrow">{card.category}</Text>
            {card.bookmarked && (
              <Text variant="body" color="inkMuted">
                {'\u25CF'}
              </Text>
            )}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

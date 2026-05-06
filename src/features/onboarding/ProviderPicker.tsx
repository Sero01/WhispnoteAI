import { Pressable, View } from 'react-native';
import { Card, Text } from '@/components';
import { useTheme } from '@/theme';
import type { AIProvider } from '@/store/settings';

type Props = { value: AIProvider | null; onChange: (p: AIProvider) => void };

const providers: { id: AIProvider; name: string; tagline: string }[] = [
  { id: 'openai', name: 'OpenAI', tagline: 'GPT models with broad capabilities' },
  { id: 'anthropic', name: 'Anthropic', tagline: 'Claude models with safety focus' },
  { id: 'openrouter', name: 'OpenRouter', tagline: 'Unified access to many models' },
];

const accentMap: Record<AIProvider, 'sage' | 'lavender' | 'peach'> = {
  openai: 'sage',
  anthropic: 'lavender',
  openrouter: 'peach',
};

export function ProviderPicker({ value, onChange }: Props): React.ReactElement {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing(3) }}>
      {providers.map((p) => {
        const selected = value === p.id;
        return (
          <Pressable key={p.id} onPress={() => onChange(p.id)}>
            <Card
              accent={selected ? accentMap[p.id] : 'surface'}
              size="sm"
              bordered={!selected}
              style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flex: 1 }}>
                <Text variant="title">{p.name}</Text>
                <Text variant="body" color="inkMuted">{p.tagline}</Text>
              </View>
              {selected && (
                <Text variant="body" weight="bold" style={{ marginLeft: theme.spacing(2) }}>
                  ✓
                </Text>
              )}
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
}

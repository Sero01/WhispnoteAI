import { useState } from 'react';
import { Modal, View, TextInput, Alert } from 'react-native';
import { Card, Text, Button } from '@/components';
import { useTheme } from '@/theme';
import { decksRepo } from '@/lib/db';
import type { Deck, DeckAccent } from '@/types';

type Props = {
  deck: Deck;
  visible: boolean;
  onClose: () => void;
  onSaved: (updated: Deck) => void;
  onDeleted: (id: string) => void;
};

const ACCENTS: DeckAccent[] = ['sage', 'lavender', 'peach', 'cream'];

export function DeckEditSheet(props: Props): React.ReactElement {
  const { deck, visible, onClose, onSaved, onDeleted } = props;
  const theme = useTheme();
  const [name, setName] = useState(deck.name);
  const [accent, setAccent] = useState<DeckAccent>(deck.accent);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const updated = await decksRepo.update(deck.id, { name: name.trim(), accent });
      onSaved(updated);
      onClose();
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete deck', 'Are you sure you want to delete this deck?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await decksRepo.delete(deck.id);
            onDeleted(deck.id);
          } catch {
            // silently fail
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
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
              Edit deck
            </Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Deck name"
              style={{
                fontFamily: theme.typography.body,
                fontSize: 16,
                lineHeight: 24,
                color: theme.colors.ink,
                borderWidth: 1,
                borderColor: theme.colors.inkMuted,
                borderRadius: theme.radii.md,
                paddingHorizontal: theme.spacing(3),
                paddingVertical: theme.spacing(2),
              }}
              placeholderTextColor={theme.colors.inkMuted}
            />

            <View style={{ gap: theme.spacing(2) }}>
              <Text variant="eyebrow" color="inkMuted">
                Accent
              </Text>
              <View style={{ flexDirection: 'row', gap: theme.spacing(3) }}>
                {ACCENTS.map((a) => (
                  <View
                    key={a}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: theme.colors.accent[a],
                      borderWidth: a === accent ? 3 : 0,
                      borderColor: theme.colors.ink,
                    }}
                  >
                    <Button
                      label=""
                      variant="ghost"
                      size="sm"
                      onPress={() => setAccent(a)}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 22,
                        borderWidth: 0,
                        backgroundColor: 'transparent',
                      }}
                    />
                  </View>
                ))}
              </View>
            </View>

            <Button
              label="Save"
              variant="primary"
              fullWidth
              loading={saving}
              disabled={!name.trim()}
              onPress={handleSave}
            />

            <Button
              label="Delete deck"
              variant="ghost"
              fullWidth
              loading={deleting}
              onPress={handleDelete}
            />
          </Card>
        </View>
      </View>
    </Modal>
  );
}

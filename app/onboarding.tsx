import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Screen, Text } from '@/components';
import { useTheme } from '@/theme';
import { useSettings, type AIProvider } from '@/store/settings';
import { setApiKey } from '@/lib/secureStore';
import { validateApiKey } from '@/lib/validateApiKey';
import { ProviderPicker } from '@/features/onboarding/ProviderPicker';

export default function OnboardingScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [provider, setProvider] = useState<AIProvider | null>(null);
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const trimmedKey = key.trim();
  const canSave = provider !== null && trimmedKey.length > 0;

  const handleSave = async () => {
    if (!provider || !trimmedKey) return;
    const result = validateApiKey(provider, trimmedKey);
    if (!result.ok) {
      setError(result.reason ?? 'Invalid API key');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await setApiKey(trimmedKey);
      useSettings.getState().setProvider(provider);
      useSettings.getState().setOnboarded(true);
      router.replace('/');
    } catch {
      setError('Failed to save API key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen padding="md" scroll>
      <View style={{ gap: theme.spacing(5) }}>
        <View style={{ gap: theme.spacing(2) }}>
          <Text variant="display">Welcome</Text>
          <Text variant="body" color="inkMuted">
            Choose how you&apos;d like Whispnote to organize your notes.
          </Text>
        </View>

        <ProviderPicker value={provider} onChange={(p) => { setProvider(p); setError(null); }} />

        <TextInput
          value={key}
          onChangeText={(t) => { setKey(t); setError(null); }}
          placeholder="Paste your API key"
          placeholderTextColor={theme.colors.inkMuted}
          secureTextEntry
          style={{
            borderWidth: 1,
            borderColor: theme.colors.inkMuted + '40',
            borderRadius: theme.radii.lg,
            paddingHorizontal: theme.spacing(3),
            paddingVertical: theme.spacing(3),
            fontFamily: theme.typography.bodyMedium,
            fontSize: 16,
            height: 48,
            color: theme.colors.ink,
            backgroundColor: theme.colors.surface,
          }}
        />

        {error && (
          <Text color="ink">{error}</Text>
        )}

        <Button
          testID="get-started-btn"
          label="Get started"
          fullWidth
          disabled={!canSave}
          loading={loading}
          onPress={handleSave}
        />
      </View>
    </Screen>
  );
}

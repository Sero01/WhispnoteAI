import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Screen, Text } from '@/components';
import { useTheme } from '@/theme';
import { useSettings } from '@/store/settings';
import { setApiKey, clearApiKey } from '@/lib/secureStore';
import { validateApiKey } from '@/lib/validateApiKey';
import { ProviderPicker } from '@/features/onboarding/ProviderPicker';

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const provider = useSettings((s) => s.provider);
  const modelOverride = useSettings((s) => s.modelOverride);
  const setProvider = useSettings((s) => s.setProvider);
  const setModelOverride = useSettings((s) => s.setModelOverride);

  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modelText, setModelText] = useState(modelOverride ?? '');

  const handleUpdateKey = async () => {
    const trimmed = key.trim();
    if (!provider || !trimmed) return;
    const result = validateApiKey(provider, trimmed);
    if (!result.ok) {
      setError(result.reason ?? 'Invalid API key');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await setApiKey(trimmed);
      setKey('');
    } catch {
      setError('Failed to save API key');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await clearApiKey();
    useSettings.getState().reset();
    router.replace('/onboarding');
  };

  return (
    <Screen scroll padding="md">
      <View style={{ gap: theme.spacing(5) }}>
        <Text variant="display">Settings</Text>

        <View style={{ gap: theme.spacing(2) }}>
          <Text variant="eyebrow">AI provider</Text>
          <ProviderPicker
            value={provider}
            onChange={(p) => { setProvider(p); setError(null); }}
          />
        </View>

        <View style={{ gap: theme.spacing(2) }}>
          <Text variant="eyebrow">API key</Text>
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
          <Button
            label="Update key"
            onPress={handleUpdateKey}
            loading={loading}
            disabled={!provider || !key.trim()}
          />
          {error && <Text color="ink">{error}</Text>}
        </View>

        {provider === 'openrouter' && (
          <View style={{ gap: theme.spacing(2) }}>
            <Text variant="eyebrow">Model override</Text>
            <TextInput
              value={modelText}
              onChangeText={(t) => {
                setModelText(t);
                setModelOverride(t || null);
              }}
              placeholder="e.g. google/gemini-2.5-flash"
              placeholderTextColor={theme.colors.inkMuted}
              style={{
                borderWidth: 1,
                borderColor: theme.colors.inkMuted + '40',
                borderRadius: theme.radii.lg,
                paddingHorizontal: theme.spacing(3),
                paddingVertical: theme.spacing(3),
                fontFamily: theme.typography.body,
                fontSize: 16,
                height: 48,
                color: theme.colors.ink,
                backgroundColor: theme.colors.surface,
              }}
            />
          </View>
        )}

        <Button
          variant="ghost"
          label="Sign out / reset"
          onPress={handleSignOut}
        />
      </View>
    </Screen>
  );
}

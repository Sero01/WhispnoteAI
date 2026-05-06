import '../global.css';

import { Redirect, Stack } from 'expo-router';
import { AppProviders } from '@/providers/AppProviders';
import { useAppFonts } from '@/lib/fonts';
import { useSettings } from '@/store/settings';

export default function RootLayout() {
  const { fontsLoaded } = useAppFonts();
  const onboarded = useSettings((s) => s.onboarded);

  if (!fontsLoaded) return null;
  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <AppProviders>
      <Stack>
        <Stack.Screen name="record" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
    </AppProviders>
  );
}

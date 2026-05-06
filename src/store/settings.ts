import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AIProvider = 'openai' | 'anthropic' | 'openrouter';

export type SettingsState = {
  provider: AIProvider | null;
  modelOverride: string | null;
  onboarded: boolean;
};

export type SettingsActions = {
  setProvider(p: AIProvider): void;
  setModelOverride(m: string | null): void;
  setOnboarded(v: boolean): void;
  reset(): void;
};

const initialState: SettingsState = {
  provider: null,
  modelOverride: null,
  onboarded: false,
};

export const useSettings = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      ...initialState,
      setProvider: (p) => set({ provider: p }),
      setModelOverride: (m) => set({ modelOverride: m }),
      setOnboarded: (v) => set({ onboarded: v }),
      reset: () => set(initialState),
    }),
    {
      name: 'whispnote.settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

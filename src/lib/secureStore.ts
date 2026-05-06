import * as SecureStore from 'expo-secure-store';

const KEY = 'whispnote.apiKey';

export async function getApiKey(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY);
}

export async function setApiKey(key: string): Promise<void> {
  return SecureStore.setItemAsync(KEY, key);
}

export async function clearApiKey(): Promise<void> {
  return SecureStore.deleteItemAsync(KEY);
}

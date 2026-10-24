import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SETTINGS, Settings } from './schedule';

const KEY = 'dayguide.settings.v1';

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(s: Settings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(s));
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { DEFAULT_SETTINGS, Settings } from './schedule';

const KEY = 'dayguide.settings.v1';
// The family code is the key to the family's data, so on phones it's kept in the
// secure keychain rather than with the other settings.
const CODE_KEY = 'clocka.householdCode';
const secure = Platform.OS !== 'web';
const keychain = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK };

async function readCode(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(CODE_KEY, keychain);
  } catch {
    // Rare keychain hiccup: try once more.
    return SecureStore.getItemAsync(CODE_KEY, keychain).catch(() => null);
  }
}

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    // Nothing saved (new install): ignore anything left in the keychain from an old install.
    if (!raw) return DEFAULT_SETTINGS;
    const saved = JSON.parse(raw);
    // Phones set up before first-run setup existed already have their names.
    if (saved.role && saved.setupDone === undefined) saved.setupDone = true;
    if (secure) {
      const code = await readCode();
      if (code) saved.householdCode = code;
      else if (saved.householdCode) {
        // Older version kept the code with the settings: move it into the keychain.
        await saveSettings({ ...DEFAULT_SETTINGS, ...saved });
      }
    }
    return { ...DEFAULT_SETTINGS, ...saved };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(s: Settings): Promise<void> {
  if (!secure) {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
    return;
  }
  if (s.householdCode) await SecureStore.setItemAsync(CODE_KEY, s.householdCode, keychain);
  else await SecureStore.deleteItemAsync(CODE_KEY, keychain).catch(() => {});
  await AsyncStorage.setItem(KEY, JSON.stringify({ ...s, householdCode: '' }));
}

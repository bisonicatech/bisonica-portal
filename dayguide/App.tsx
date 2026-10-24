import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import ClockScreen from './src/ClockScreen';
import SettingsScreen from './src/SettingsScreen';
import { DEFAULT_SETTINGS, Settings, currentEntry } from './src/schedule';
import { loadSettings, saveSettings } from './src/storage';
import { syncReminders } from './src/reminders';

export default function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isNight, setIsNight] = useState(false);

  useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s);
      setLoaded(true);
      syncReminders(s).catch(() => {});
    });
  }, []);

  // Keep the screen on while the app is open during the day, but let it go dark at night.
  useEffect(() => {
    const check = () => setIsNight(currentEntry(settings.entries, new Date())?.mode === 'night');
    check();
    const t = setInterval(check, 30_000);
    return () => clearInterval(t);
  }, [settings]);

  useEffect(() => {
    if (isNight) deactivateKeepAwake().catch(() => {});
    else activateKeepAwakeAsync().catch(() => {});
  }, [isNight]);

  const handleSave = async (s: Settings) => {
    setSettings(s);
    setShowSettings(false);
    await saveSettings(s);
    await syncReminders(s).catch(() => {});
  };

  if (!loaded) return null;

  return (
    <>
      <StatusBar hidden />
      {showSettings ? (
        <SettingsScreen settings={settings} onSave={handleSave} onClose={() => setShowSettings(false)} />
      ) : (
        <ClockScreen settings={settings} onOpenSettings={() => setShowSettings(true)} />
      )}
    </>
  );
}

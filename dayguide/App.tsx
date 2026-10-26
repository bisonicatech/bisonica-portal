import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Notifications from 'expo-notifications';
import ClockScreen from './src/ClockScreen';
import SettingsScreen from './src/SettingsScreen';
import FamilyScreen from './src/FamilyScreen';
import WelcomeScreen from './src/WelcomeScreen';
import PatientSetup from './src/PatientSetup';
import { DEFAULT_SETTINGS, Role, Settings, currentEntry } from './src/schedule';
import { FamilyError } from './src/family';
import { loadSettings, saveSettings } from './src/storage';
import { clearReminders, syncReminders } from './src/reminders';
import { Household, checkIn, familyEnabled, getHouseholdAsPatient, registerForPush, setSchedule } from './src/family';

export default function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [household, setHousehold] = useState<Household | null>(null);
  const [isNight, setIsNight] = useState(false);

  // Latest settings for async work that outlives a render.
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const persist = useCallback(async (s: Settings) => {
    settingsRef.current = s;
    setSettings(s);
    await saveSettings(s);
  }, []);

  const isPatient = settings.role === 'patient';
  const code = isPatient && familyEnabled ? settings.householdCode : '';

  useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s);
      setLoaded(true);
    });
  }, []);

  // Daily reminders only belong on the cared-for person's phone.
  useEffect(() => {
    if (!loaded) return;
    if (isPatient) syncReminders(settings).catch(() => {});
    else clearReminders().catch(() => {});
  }, [loaded, isPatient, settings]);

  // Keep the screen on while the clock is open during the day, but let it go dark at night.
  useEffect(() => {
    const check = () => setIsNight(currentEntry(settings.entries, new Date())?.mode === 'night');
    check();
    const t = setInterval(check, 30_000);
    return () => clearInterval(t);
  }, [settings]);

  useEffect(() => {
    if (isPatient && !isNight) activateKeepAwakeAsync().catch(() => {});
    else deactivateKeepAwake().catch(() => {});
  }, [isPatient, isNight]);

  // Cared-for person's phone: follow Out mode, check-ins and the shared schedule.
  const refresh = useCallback(async () => {
    if (!code) return setHousehold(null);
    try {
      const h = await getHouseholdAsPatient(code);
      setHousehold(h);
      // The server gave this family a new, longer code: remember it.
      if (h.code && h.code !== settingsRef.current.householdCode) {
        await persist({ ...settingsRef.current, householdCode: h.code });
        return;
      }
      if (h.schedule === undefined) return; // server doesn't share schedules yet
      const s = settingsRef.current;
      if (s.schedulePending || h.schedule === null) {
        // Send this phone's schedule: an edit made here, or nothing shared yet.
        const saved = await setSchedule(code, s.entries);
        setHousehold(saved);
        await persist({ ...settingsRef.current, schedulePending: false, scheduleUpdatedAt: saved.schedule_updated_at ?? undefined });
      } else if (h.schedule_updated_at && h.schedule_updated_at !== s.scheduleUpdatedAt) {
        // The family member changed the schedule: use theirs.
        await persist({ ...s, entries: h.schedule, scheduleUpdatedAt: h.schedule_updated_at });
      }
    } catch (e) {
      // The family deleted their Clocka data: unlink, but keep this phone's own schedule.
      if (e instanceof FamilyError && e.kind === 'not_found') {
        setHousehold(null);
        await persist({ ...settingsRef.current, householdCode: '', scheduleUpdatedAt: undefined, schedulePending: false });
      }
      // Otherwise keep showing the last known state if the connection drops; try again next time.
    }
  }, [code, persist]);

  const doCheckIn = useCallback(async () => {
    if (!code) return;
    try {
      setHousehold(await checkIn(code));
    } catch {
      refresh();
    }
  }, [code, refresh]);

  useEffect(() => {
    if (!code) {
      setHousehold(null);
      return;
    }
    refresh();
    registerForPush(code, 'patient').catch(() => {});
    const t = setInterval(refresh, 15_000);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => {
      clearInterval(t);
      sub.remove();
    };
  }, [code, refresh]);

  // Tapping the "Are you okay?" notification counts as "I'm okay".
  useEffect(() => {
    if (!code || Platform.OS === 'web') return;
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      if (r.notification.request.content.data?.type === 'checkin') doCheckIn();
    });
    return () => sub.remove();
  }, [code, doCheckIn]);

  const save = async (s: Settings) => {
    const scheduleChanged = JSON.stringify(s.entries) !== JSON.stringify(settings.entries);
    const next = s.role === 'patient' && s.householdCode && scheduleChanged ? { ...s, schedulePending: true } : s;
    setShowSettings(false);
    await persist(next);
    // Send a schedule edit straight away (if the code changed, the refresh effect does it).
    if (next.schedulePending && next.householdCode === settings.householdCode) refresh();
  };

  // Remove everything Clocka has saved on this phone and start again.
  // (Stable, because the family screen's refresh depends on it.)
  const resetPhone = useCallback(async () => {
    setShowSettings(false);
    setHousehold(null);
    await clearReminders().catch(() => {});
    await persist(DEFAULT_SETTINGS);
  }, [persist]);

  // Going back to "who is this phone for?" also re-runs first-run setup.
  const chooseRole = (role: Role | undefined) => save({ ...settings, role, ...(role ? {} : { setupDone: false }) });

  if (!loaded) return null;

  let screen;
  if (!settings.role) {
    screen = <WelcomeScreen onChoose={chooseRole} />;
  } else if (settings.role === 'patient' && !settings.setupDone) {
    screen = <PatientSetup settings={settings} onDone={(s) => save({ ...s, setupDone: true })} onBack={() => chooseRole(undefined)} />;
  } else if (settings.role === 'carer') {
    screen = <FamilyScreen settings={settings} onSave={save} onChangeRole={() => chooseRole(undefined)} onReset={resetPhone} />;
  } else if (showSettings) {
    screen = (
      <SettingsScreen
        settings={settings}
        household={household}
        onSave={save}
        onClose={() => setShowSettings(false)}
        onChangeRole={() => chooseRole(undefined)}
        onReset={resetPhone}
      />
    );
  } else {
    screen = (
      <ClockScreen
        settings={settings}
        household={household}
        onOpenSettings={() => setShowSettings(true)}
        onCheckIn={doCheckIn}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar hidden={isPatient && !showSettings} style="dark" />
      {screen}
    </SafeAreaProvider>
  );
}

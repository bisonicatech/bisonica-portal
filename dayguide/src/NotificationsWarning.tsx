import { useEffect, useState } from 'react';
import { AppState, Linking, Platform, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Button, form } from './ui';

/** A warning card shown when notifications are switched off for Clocka, with a button to fix it. */
export function NotificationsWarning({ why }: { why: string }) {
  const [off, setOff] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const check = () =>
      Notifications.getPermissionsAsync()
        .then((p) => setOff(!p.granted && p.status === 'denied'))
        .catch(() => {});
    check();
    // Check again when they come back from the Settings app.
    const sub = AppState.addEventListener('change', (s) => s === 'active' && check());
    return () => sub.remove();
  }, []);

  if (!off) return null;
  return (
    <View style={[form.card, { borderColor: '#e0b44c', backgroundColor: '#fff8e6' }]}>
      <Text style={[form.warn, { marginTop: 0 }]}>Notifications are switched off</Text>
      <Text style={form.hint}>{why}</Text>
      <Button label="Open Settings" onPress={() => Linking.openSettings().catch(() => {})} primary />
    </View>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Mode, Settings, currentEntry, fillName, periodLabel } from './schedule';

const THEMES: Record<Mode, { bg: string; text: string; sub: string }> = {
  night: { bg: '#05070f', text: '#7f86a8', sub: '#4d5373' },
  morning: { bg: '#fff3d1', text: '#3a2a00', sub: '#7a5c12' },
  day: { bg: '#e6f2ff', text: '#0b2540', sub: '#3d5a7a' },
  evening: { bg: '#ffe2cf', text: '#4a1f00', sub: '#8a4a20' },
};

type Props = { settings: Settings; onOpenSettings: () => void };

export default function ClockScreen({ settings, onOpenSettings }: Props) {
  const [now, setNow] = useState(new Date());
  const { width } = useWindowDimensions();
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const entry = currentEntry(settings.entries, now);
  const mode: Mode = entry?.mode ?? 'day';
  const theme = THEMES[mode];

  const time = now
    .toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(/\s?(am|pm)/i, (m) => ' ' + m.trim().toLowerCase());
  const day = now.toLocaleDateString('en-GB', { weekday: 'long' });
  const date = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });

  // Family opens settings by holding the top-right corner for 3 seconds.
  const startHold = () => {
    holdTimer.current = setTimeout(onOpenSettings, 3000);
  };
  const endHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
  };

  const base = Math.min(width, 600);

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <Pressable
        onPressIn={startHold}
        onPressOut={endHold}
        style={styles.hiddenCorner}
        accessibilityLabel="Hold for 3 seconds to open settings"
      />
      <Text style={[styles.period, { color: theme.text, fontSize: base * 0.1 }]}>{periodLabel(now, entry?.mode)}</Text>
      <Text style={[styles.time, { color: theme.text, fontSize: base * 0.17 }]}>{time}</Text>
      <Text style={[styles.date, { color: theme.sub, fontSize: base * 0.065 }]}>
        {day} {date}
      </Text>

      {entry && (
        <View style={styles.messageBox}>
          <Text style={{ fontSize: base * 0.18, opacity: mode === 'night' ? 0.5 : 1 }}>{entry.icon}</Text>
          <Text style={[styles.message, { color: theme.text, fontSize: base * 0.085 }]}>
            {fillName(entry.message, settings.name)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  hiddenCorner: { position: 'absolute', top: 0, right: 0, width: 90, height: 90, zIndex: 10 },
  period: { fontWeight: '700', letterSpacing: 1, textAlign: 'center' },
  time: { fontWeight: '800', textAlign: 'center', marginVertical: 4 },
  date: { fontWeight: '500', textAlign: 'center' },
  messageBox: { marginTop: 40, alignItems: 'center', maxWidth: 700 },
  message: { fontWeight: '700', textAlign: 'center', marginTop: 12, lineHeight: undefined },
});

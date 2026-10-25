import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mode, Settings, currentEntry, fillName, periodLabel } from './schedule';
import { Household, checkInDue, formatTime, hasPremium } from './family';

const THEMES: Record<Mode, { bg: string; text: string; sub: string }> = {
  night: { bg: '#05070f', text: '#7f86a8', sub: '#4d5373' },
  morning: { bg: '#fff3d1', text: '#3a2a00', sub: '#7a5c12' },
  day: { bg: '#e6f2ff', text: '#0b2540', sub: '#3d5a7a' },
  evening: { bg: '#ffe2cf', text: '#4a1f00', sub: '#8a4a20' },
};

type Props = {
  settings: Settings;
  household: Household | null;
  onOpenSettings: () => void;
  onCheckIn: () => void;
};

export default function ClockScreen({ settings, household, onOpenSettings, onCheckIn }: Props) {
  const [now, setNow] = useState(new Date());
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const entry = currentEntry(settings.entries, now);
  const mode: Mode = entry?.mode ?? 'day';
  const theme = THEMES[mode];
  const isOut = !!household?.is_out;
  const askOkay = checkInDue(household, now);

  const premium = hasPremium(household);
  // A one-off message from the family (Premium) comes first, then Out mode, then the schedule.
  const adhoc =
    premium && household?.adhoc_message && household.adhoc_until && new Date(household.adhoc_until) > now ? household.adhoc_message : '';
  const icon = adhoc ? '💬' : isOut ? '🏡' : entry?.icon;
  const carerName = household?.carer_name || settings.carerName;
  // If the family member is running late, "back at 3pm" would be confusing at 4pm.
  const late = isOut && !!household?.back_at && now.getTime() > new Date(household.back_at).getTime() + 15 * 60000;
  const outMessage = late
    ? `${carerName || 'Your family'} will be home soon.${carerName ? ` Call ${carerName} if you need anything.` : ''}`
    : household?.out_message ?? '';
  const message = adhoc || (isOut ? outMessage : entry ? fillName(entry.message, settings.name) : '');

  const carerPhone = household?.carer_phone || settings.carerPhone;
  const showCalls = mode !== 'night' || isOut;
  // Premium: extra call buttons and a FaceTime video call button (iPhone only).
  const extras = premium && showCalls ? (household?.contacts ?? []) : [];
  const video = premium && showCalls && Platform.OS === 'ios' ? household?.video_contact : null;
  const dial = (phone: string) => Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`).catch(() => {});

  const time = formatTime(now);
  const day = now.toLocaleDateString('en-GB', { weekday: 'long' });
  const date = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });

  // Family opens settings by holding the clock time for 3 seconds.
  const startHold = () => {
    holdTimer.current = setTimeout(onOpenSettings, 3000);
  };
  const endHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
  };

  // Size everything from the smaller of width and height so it fits on any phone.
  const buttons = (askOkay ? 1 : 0) + (carerPhone && showCalls ? 1 : 0) + Math.ceil(extras.length / 2) + (video ? 1 : 0);
  const base = Math.min(width, height * (buttons === 0 ? 0.6 : buttons <= 2 ? 0.5 : 0.4), 600);

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={[
        styles.root,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16, paddingLeft: insets.left + 20, paddingRight: insets.right + 20 },
      ]}
    >
      <Text style={[styles.period, { color: theme.text, fontSize: base * 0.1 }]}>{periodLabel(now, entry?.mode)}</Text>
      <Pressable onPressIn={startHold} onPressOut={endHold} accessibilityHint="Family: hold for 3 seconds to open settings">
        <Text style={[styles.time, { color: theme.text, fontSize: base * 0.17 }]}>{time}</Text>
      </Pressable>
      <Text style={[styles.date, { color: theme.sub, fontSize: base * 0.065 }]}>
        {day} {date}
      </Text>

      {!!message && (
        <View style={styles.messageBox}>
          <Text style={{ fontSize: base * (askOkay ? 0.12 : 0.18), opacity: mode === 'night' ? 0.5 : 1 }}>{icon}</Text>
          <Text style={[styles.message, { color: theme.text, fontSize: base * (askOkay ? 0.065 : 0.085) }]}>{message}</Text>
        </View>
      )}

      {askOkay && (
        <Pressable onPress={onCheckIn} style={[styles.bigButton, styles.okay]} accessibilityRole="button">
          <Text style={styles.bigButtonText}>I'm okay 👍</Text>
          <Text style={styles.bigButtonSub}>Tap to tell {carerName || 'your family'}</Text>
        </Pressable>
      )}

      {!!carerPhone && showCalls && (
        <Pressable onPress={() => dial(carerPhone)} style={[styles.bigButton, styles.call]} accessibilityRole="button">
          <Text style={styles.bigButtonText}>📞 Call {carerName || 'family'}</Text>
        </Pressable>
      )}

      {!!video && (
        <Pressable
          onPress={() => Linking.openURL(`facetime:${video.handle.replace(/\s/g, '')}`).catch(() => {})}
          style={[styles.bigButton, styles.video]}
          accessibilityRole="button"
        >
          <Text style={styles.bigButtonText}>🎥 Video call {video.name}</Text>
        </Pressable>
      )}

      {extras.length > 0 && (
        <View style={styles.extras}>
          {extras.map((c, i) => (
            <Pressable key={i} onPress={() => dial(c.phone)} style={styles.smallButton} accessibilityRole="button">
              <Text style={styles.smallButtonText} numberOfLines={1}>
                📞 {c.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  period: { fontWeight: '700', letterSpacing: 1, textAlign: 'center' },
  time: { fontWeight: '800', textAlign: 'center', marginVertical: 4 },
  date: { fontWeight: '500', textAlign: 'center' },
  messageBox: { marginTop: 20, alignItems: 'center', maxWidth: 700 },
  message: { fontWeight: '700', textAlign: 'center', marginTop: 12 },
  bigButton: { marginTop: 18, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 28, alignItems: 'center', minWidth: 260 },
  okay: { backgroundColor: '#1e8e3e' },
  call: { backgroundColor: '#1f3b73' },
  video: { backgroundColor: '#5b3fa0' },
  extras: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 14, maxWidth: 560 },
  smallButton: { backgroundColor: '#2f5597', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, minWidth: 150, alignItems: 'center' },
  smallButtonText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  bigButtonText: { color: '#fff', fontSize: 26, fontWeight: '800' },
  bigButtonSub: { color: '#e6ffe9', fontSize: 17, marginTop: 4 },
});

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Entry, Mode, Settings, newId, parseTime, sortEntries } from './schedule';

type Props = {
  settings: Settings;
  onSave: (s: Settings) => void;
  onClose: () => void;
};

const MODES: { mode: Mode; label: string }[] = [
  { mode: 'morning', label: 'Morning' },
  { mode: 'day', label: 'Day' },
  { mode: 'evening', label: 'Evening' },
  { mode: 'night', label: 'Night (silent)' },
];

export default function SettingsScreen({ settings, onSave, onClose }: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [pinTry, setPinTry] = useState('');
  const [draft, setDraft] = useState<Settings>(settings);
  const [error, setError] = useState('');

  if (!unlocked) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.h1}>Family settings</Text>
        <Text style={styles.label}>Enter PIN</Text>
        <TextInput
          style={[styles.input, styles.pin]}
          value={pinTry}
          onChangeText={setPinTry}
          keyboardType="number-pad"
          secureTextEntry
          autoFocus
          onSubmitEditing={() => (pinTry === settings.pin ? setUnlocked(true) : setError('Wrong PIN'))}
        />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <View style={styles.row}>
          <Button label="Back" onPress={onClose} />
          <Button
            label="Unlock"
            primary
            onPress={() => (pinTry === settings.pin ? setUnlocked(true) : setError('Wrong PIN'))}
          />
        </View>
      </View>
    );
  }

  const update = (id: string, patch: Partial<Entry>) =>
    setDraft((d) => ({ ...d, entries: d.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));

  const remove = (id: string) => setDraft((d) => ({ ...d, entries: d.entries.filter((e) => e.id !== id) }));

  const add = () =>
    setDraft((d) => ({
      ...d,
      entries: [...d.entries, { id: newId(), time: '12:00', mode: 'day', sound: true, icon: '🙂', message: '' }],
    }));

  const save = () => {
    const bad = draft.entries.find((e) => parseTime(e.time) === null);
    if (bad) return setError(`"${bad.time}" isn't a valid time. Use 24-hour HH:MM, e.g. 07:30 or 21:00.`);
    if (!/^\d{4,8}$/.test(draft.pin)) return setError('PIN must be 4 to 8 digits.');
    setError('');
    onSave({ ...draft, entries: sortEntries(draft.entries) });
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 60 }}>
      <Text style={styles.h1}>Family settings</Text>

      <Text style={styles.label}>His name (used where a message says {'{name}'})</Text>
      <TextInput style={styles.input} value={draft.name} onChangeText={(name) => setDraft({ ...draft, name })} placeholder="e.g. Dad" />

      <Text style={styles.label}>Settings PIN</Text>
      <TextInput
        style={styles.input}
        value={draft.pin}
        onChangeText={(pin) => setDraft({ ...draft, pin })}
        keyboardType="number-pad"
      />

      <Text style={styles.h2}>Daily schedule</Text>
      <Text style={styles.hint}>
        Each message shows from its time until the next one. Night messages never make a sound.
      </Text>

      {draft.entries.map((e) => (
        <View key={e.id} style={styles.card}>
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.time]} value={e.time} onChangeText={(time) => update(e.id, { time })} placeholder="07:00" />
            <TextInput style={[styles.input, styles.icon]} value={e.icon} onChangeText={(icon) => update(e.id, { icon })} />
            <Pressable onPress={() => remove(e.id)} style={styles.delete}>
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          </View>
          <TextInput
            style={[styles.input, { minHeight: 60 }]}
            value={e.message}
            onChangeText={(message) => update(e.id, { message })}
            multiline
            placeholder="What should he do now?"
          />
          <View style={styles.modes}>
            {MODES.map((m) => (
              <Pressable
                key={m.mode}
                onPress={() => update(e.id, { mode: m.mode })}
                style={[styles.chip, e.mode === m.mode && styles.chipOn]}
              >
                <Text style={[styles.chipText, e.mode === m.mode && styles.chipTextOn]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
          {e.mode !== 'night' && (
            <View style={styles.row}>
              <Switch value={e.sound} onValueChange={(sound) => update(e.id, { sound })} />
              <Text style={styles.switchLabel}>Reminder sound at this time</Text>
            </View>
          )}
        </View>
      ))}

      <Button label="+ Add a time" onPress={add} />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <View style={[styles.row, { marginTop: 20 }]}>
        <Button label="Cancel" onPress={onClose} />
        <Button label="Save" primary onPress={save} />
      </View>
    </ScrollView>
  );
}

function Button({ label, onPress, primary }: { label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.button, primary && styles.buttonPrimary]}>
      <Text style={[styles.buttonText, primary && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f7f9', padding: 20, paddingTop: 60 },
  center: { alignItems: 'center', justifyContent: 'center' },
  h1: { fontSize: 26, fontWeight: '800', marginBottom: 12, color: '#111' },
  h2: { fontSize: 20, fontWeight: '700', marginTop: 24, color: '#111' },
  hint: { color: '#555', marginBottom: 12, marginTop: 4 },
  label: { fontSize: 15, color: '#333', marginTop: 12, marginBottom: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccd', borderRadius: 8, padding: 10, fontSize: 17, marginVertical: 4 },
  pin: { width: 160, textAlign: 'center', fontSize: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e4ea' },
  time: { width: 90, textAlign: 'center' },
  icon: { width: 60, textAlign: 'center' },
  delete: { marginLeft: 'auto', padding: 8 },
  deleteText: { color: '#c0392b', fontWeight: '600' },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 6 },
  chip: { borderWidth: 1, borderColor: '#99a', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  chipOn: { backgroundColor: '#1f3b73', borderColor: '#1f3b73' },
  chipText: { color: '#333' },
  chipTextOn: { color: '#fff' },
  switchLabel: { fontSize: 15, color: '#333' },
  button: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, backgroundColor: '#e3e6ee', marginTop: 8 },
  buttonPrimary: { backgroundColor: '#1f3b73' },
  buttonText: { fontSize: 17, fontWeight: '700', color: '#1f3b73' },
  error: { color: '#c0392b', marginTop: 10, fontSize: 15 },
});

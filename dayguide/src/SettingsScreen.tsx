import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Entry, Mode, Settings, newId, parseTime, sortEntries } from './schedule';
import { familyEnabled } from './family';
import { Button, form } from './ui';

type Props = {
  settings: Settings;
  onSave: (s: Settings) => void;
  onClose: () => void;
  onChangeRole: () => void;
};

const MODES: { mode: Mode; label: string }[] = [
  { mode: 'morning', label: 'Morning' },
  { mode: 'day', label: 'Day' },
  { mode: 'evening', label: 'Evening' },
  { mode: 'night', label: 'Night (silent)' },
];

export default function SettingsScreen({ settings, onSave, onClose, onChangeRole }: Props) {
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

      <Text style={styles.label}>Name of the person using this phone (used where a message says {'{name}'})</Text>
      <TextInput style={styles.input} value={draft.name} onChangeText={(name) => setDraft({ ...draft, name })} placeholder="e.g. David" />

      <Text style={styles.label}>Family member's name (for the Call button)</Text>
      <TextInput style={styles.input} value={draft.carerName} onChangeText={(carerName) => setDraft({ ...draft, carerName })} placeholder="e.g. Carrie" />

      <Text style={styles.label}>Family member's phone number</Text>
      <TextInput
        style={styles.input}
        value={draft.carerPhone}
        onChangeText={(carerPhone) => setDraft({ ...draft, carerPhone })}
        keyboardType="phone-pad"
        placeholder="Leave blank to hide the Call button"
      />

      {familyEnabled && (
        <>
          <Text style={styles.label}>Family code (from the family member's DayGuide app)</Text>
          <TextInput
            style={styles.input}
            value={draft.householdCode}
            onChangeText={(householdCode) => setDraft({ ...draft, householdCode: householdCode.trim().toUpperCase() })}
            autoCapitalize="characters"
            placeholder="e.g. 4A5891DA82"
          />
        </>
      )}

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
      <Pressable onPress={onChangeRole} style={{ marginTop: 32 }}>
        <Text style={styles.hint}>Change what this phone is for…</Text>
      </Pressable>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  ...form,
  pin: { width: 160, textAlign: 'center', fontSize: 24 },
  time: { width: 90, textAlign: 'center' },
  icon: { width: 60, textAlign: 'center' },
  delete: { marginLeft: 'auto', padding: 8 },
  deleteText: { color: '#c0392b', fontWeight: '600' },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 6 },
  switchLabel: { fontSize: 15, color: '#333' },
});

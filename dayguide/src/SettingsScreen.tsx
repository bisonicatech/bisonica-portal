import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Entry, Mode, Settings, newId, parseTime, sortEntries } from './schedule';
import { Household, familyEnabled, getHousehold, redeemLinkCode } from './family';
import { Button, Screen, doneProps, form } from './ui';

type Props = {
  settings: Settings;
  /** The linked household, if this phone is connected to a family member's phone. */
  household: Household | null;
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

export default function SettingsScreen({ settings, household, onSave, onClose, onChangeRole }: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [pinTry, setPinTry] = useState('');
  const [draft, setDraft] = useState<Settings>(settings);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [linkInput, setLinkInput] = useState('');

  if (!unlocked) {
    // A PIN saved by an older version may be longer than 4 digits.
    const len = Math.max(4, settings.pin.length);
    const tryPin = (pin: string) => {
      setPinTry(pin);
      if (pin.length < len) return setError('');
      if (pin === settings.pin) return setUnlocked(true);
      setError('Wrong PIN. Try again.');
      setPinTry('');
    };
    return (
      <Screen>
        <Text style={styles.h1}>Family settings</Text>
        <Text style={styles.label}>Enter the 4-digit PIN</Text>
        <TextInput
          style={[styles.input, styles.pin]}
          value={pinTry}
          onChangeText={(t) => tryPin(t.replace(/\D/g, '').slice(0, len))}
          keyboardType="number-pad"
          maxLength={len}
          secureTextEntry
          autoFocus
          {...doneProps}
        />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Button label="Back" onPress={onClose} />
      </Screen>
    );
  }

  const linked = !!household && household.code === settings.householdCode && !!settings.householdCode;
  const carer = household?.carer_name || draft.carerName || 'the family member';

  const update = (id: string, patch: Partial<Entry>) =>
    setDraft((d) => ({ ...d, entries: d.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));

  const remove = (id: string) => setDraft((d) => ({ ...d, entries: d.entries.filter((e) => e.id !== id) }));

  const add = () =>
    setDraft((d) => ({
      ...d,
      entries: [...d.entries, { id: newId(), time: '12:00', mode: 'day', sound: true, icon: '🙂', message: '' }],
    }));

  const save = async () => {
    const bad = draft.entries.find((e) => parseTime(e.time) === null);
    if (bad) return setError(`"${bad.time}" isn't a valid time. Use 24-hour HH:MM, e.g. 07:30 or 21:00.`);
    if (!/^\d{4}$/.test(draft.pin)) return setError('The PIN must be exactly 4 digits.');
    let next = { ...draft, entries: sortEntries(draft.entries) };

    // Link with the family member's phone: a 6-digit link code, or (older servers) the long household code.
    const typed = linkInput.trim();
    if (familyEnabled && typed) {
      setSaving(true);
      try {
        const h = /^\d{6}$/.test(typed) ? await redeemLinkCode(typed) : await getHousehold(typed);
        next = {
          ...next,
          householdCode: h.code,
          name: h.patient_name || next.name,
          carerName: h.carer_name || next.carerName,
          carerPhone: h.carer_phone || next.carerPhone,
        };
      } catch (e) {
        setSaving(false);
        return setError((e as Error).message);
      }
      setSaving(false);
    }
    setError('');
    onSave(next);
  };

  const saveRow = (
    <View style={styles.row}>
      <Button label="Cancel" onPress={onClose} />
      <Button label={saving ? 'Checking…' : 'Save'} primary disabled={saving} onPress={save} />
    </View>
  );

  return (
    <Screen>
      <Text style={styles.h1}>Family settings</Text>
      {saveRow}
      {!!error && <Text style={styles.error}>{error}</Text>}

      {familyEnabled && (
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.h3}>Link to {carer}'s phone</Text>
          {linked ? (
            <Text style={styles.ok}>✓ Linked to {carer}'s phone</Text>
          ) : settings.householdCode ? (
            <Text style={styles.warn}>Can't reach {carer}'s phone right now. Check the internet connection.</Text>
          ) : (
            <Text style={styles.warn}>Not linked yet.</Text>
          )}
          <Text style={styles.label}>
            {linked ? 'To link again, enter' : 'Enter'} the 6-digit link code shown on {carer}'s phone
          </Text>
          <TextInput
            style={[styles.input, styles.code]}
            value={linkInput}
            onChangeText={(t) => {
              setError('');
              setLinkInput(t.replace(/[^0-9a-z]/gi, '').toUpperCase().slice(0, 10));
            }}
            keyboardType="number-pad"
            maxLength={10}
            placeholder="123 456"
            {...doneProps}
          />
          <Text style={styles.hint}>Then tap Save. This is not the settings PIN.</Text>
        </View>
      )}

      <Text style={styles.label}>Name of the person using this phone (used where a message says {'{name}'})</Text>
      <TextInput style={styles.input} value={draft.name} onChangeText={(name) => setDraft({ ...draft, name })} placeholder="e.g. David" {...doneProps} />

      <Text style={styles.label}>Family member's name (for the Call button)</Text>
      <TextInput style={styles.input} value={draft.carerName} onChangeText={(carerName) => setDraft({ ...draft, carerName })} placeholder="e.g. Carrie" {...doneProps} />

      <Text style={styles.label}>Family member's phone number</Text>
      <TextInput
        style={styles.input}
        value={draft.carerPhone}
        onChangeText={(carerPhone) => setDraft({ ...draft, carerPhone })}
        keyboardType="phone-pad"
        placeholder="Leave blank to hide the Call button"
        {...doneProps}
      />

      <Text style={styles.label}>Settings PIN (4 digits)</Text>
      <TextInput
        style={[styles.input, styles.pin]}
        value={draft.pin}
        onChangeText={(pin) => setDraft({ ...draft, pin: pin.replace(/\D/g, '').slice(0, 4) })}
        keyboardType="number-pad"
        maxLength={4}
        {...doneProps}
      />

      <Text style={styles.h2}>Daily schedule</Text>
      <Text style={styles.hint}>
        Each message shows from its time until the next one. Night messages never make a sound.
      </Text>

      {draft.entries.map((e) => (
        <View key={e.id} style={styles.card}>
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.time]} value={e.time} onChangeText={(time) => update(e.id, { time })} placeholder="07:00" {...doneProps} />
            <TextInput style={[styles.input, styles.icon]} value={e.icon} onChangeText={(icon) => update(e.id, { icon })} {...doneProps} />
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
            {...doneProps}
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
      <View style={{ marginTop: 12 }}>{saveRow}</View>
      <Pressable onPress={onChangeRole} style={{ marginTop: 32 }}>
        <Text style={styles.hint}>Change what this phone is for…</Text>
      </Pressable>
    </Screen>
  );
}


const styles = StyleSheet.create({
  ...form,
  pin: { width: 140, textAlign: 'center', fontSize: 26, letterSpacing: 8 },
  code: { fontSize: 28, letterSpacing: 6, textAlign: 'center' },
  h3: { fontSize: 18, fontWeight: '700', color: '#111' },
  time: { width: 90, textAlign: 'center' },
  icon: { width: 60, textAlign: 'center' },
  delete: { marginLeft: 'auto', padding: 8 },
  deleteText: { color: '#c0392b', fontWeight: '600' },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 6 },
  switchLabel: { fontSize: 15, color: '#333' },
});

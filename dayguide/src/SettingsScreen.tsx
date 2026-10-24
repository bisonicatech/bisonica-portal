import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Settings, scheduleError, sortEntries } from './schedule';
import ScheduleEditor from './ScheduleEditor';
import { DataCard, PrivacyScreen } from './PrivacyData';
import { HelpLink, HelpScreen } from './HelpSupport';
import { Household, familyEnabled, getHousehold, hasPremium, redeemLinkCode } from './family';
import { Button, Screen, doneProps, form } from './ui';

type Props = {
  settings: Settings;
  /** The linked household, if this phone is connected to a family member's phone. */
  household: Household | null;
  onSave: (s: Settings) => void;
  onClose: () => void;
  onChangeRole: () => void;
  /** Remove everything Clocka has saved on this phone. */
  onReset: () => void;
};

export default function SettingsScreen({ settings, household, onSave, onClose, onChangeRole, onReset }: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [pinTry, setPinTry] = useState('');
  const [draft, setDraft] = useState<Settings>(settings);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  if (showPrivacy) return <PrivacyScreen onClose={() => setShowPrivacy(false)} />;
  if (showHelp) return <HelpScreen onClose={() => setShowHelp(false)} />;

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

  const save = async () => {
    const bad = scheduleError(draft.entries);
    if (bad) return setError(bad);
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
      <TextInput style={styles.input} value={draft.name} onChangeText={(name) => setDraft({ ...draft, name })} placeholder="e.g. Margaret, or Dad" {...doneProps} />

      <Text style={styles.label}>Family member's name (for the Call button)</Text>
      <TextInput style={styles.input} value={draft.carerName} onChangeText={(carerName) => setDraft({ ...draft, carerName })} placeholder="e.g. Sarah" {...doneProps} />

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
      {linked && <Text style={styles.hint}>Shared with {carer}'s phone. Changes made on either phone show on both.</Text>}
      <ScheduleEditor
        entries={draft.entries}
        onChange={(entries) => setDraft((d) => ({ ...d, entries }))}
        premium={linked && hasPremium(household)}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <View style={{ marginTop: 12 }}>{saveRow}</View>
      <HelpLink onOpen={() => setShowHelp(true)} />
      <DataCard
        patient={draft.name || 'this person'}
        canDeleteAll={false}
        onDeleteAll={async () => {}}
        onRemoveHere={onReset}
        onPrivacy={() => setShowPrivacy(true)}
      />
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
});

import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Settings } from './schedule';
import { familyEnabled, redeemLinkCode } from './family';
import { Button, Screen, doneProps, form } from './ui';

type Props = {
  settings: Settings;
  onDone: (s: Settings) => void;
  onBack: () => void;
};

/** First-run setup on the cared-for person's phone. */
export default function PatientSetup({ settings, onDone, onBack }: Props) {
  const [name, setName] = useState(settings.name);
  const [linkCode, setLinkCode] = useState('');
  const [carerName, setCarerName] = useState(settings.carerName);
  const [carerPhone, setCarerPhone] = useState(settings.carerPhone);
  const [pin, setPin] = useState(settings.pin);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const linking = familyEnabled && linkCode.length > 0;

  const finish = async () => {
    setError('');
    if (!name.trim()) return setError('Please type the name of the person who will use this phone.');
    if (!/^\d{4}$/.test(pin)) return setError('The settings PIN must be exactly 4 digits.');
    let next: Settings = { ...settings, name: name.trim(), carerName: carerName.trim(), carerPhone: carerPhone.trim(), pin };

    if (linking) {
      if (!/^\d{6}$/.test(linkCode)) return setError('The link code is 6 digits.');
      setBusy(true);
      try {
        const h = await redeemLinkCode(linkCode);
        next = {
          ...next,
          householdCode: h.code,
          carerName: h.carer_name || next.carerName,
          carerPhone: h.carer_phone || next.carerPhone,
        };
      } catch (e) {
        setBusy(false);
        return setError((e as Error).message);
      }
      setBusy(false);
    }
    onDone(next);
  };

  return (
    <Screen>
      <Text style={form.h1}>Set up this phone</Text>
      <Text style={form.hint}>
        This phone will show the time and what to do now. A family member usually sets this up.
      </Text>

      <Text style={form.label}>First name of the person who will use this phone</Text>
      <TextInput style={form.input} value={name} onChangeText={setName} placeholder="e.g. Margaret, or Dad" autoCapitalize="words" {...doneProps} />
      <Text style={form.hint}>Used in messages like "Good morning, {name.trim() || 'Margaret'}!"</Text>

      {familyEnabled && (
        <View style={[form.card, { marginTop: 12 }]}>
          <Text style={styles.h3}>Link to a family member's phone (optional)</Text>
          <Text style={form.hint}>
            If a family member has DayGuide, they choose "A family member or carer" and get a 6-digit link code. Type it here. You can
            also do this later.
          </Text>
          <TextInput
            style={[form.input, styles.code]}
            value={linkCode}
            onChangeText={(t) => {
              setError('');
              setLinkCode(t.replace(/\D/g, '').slice(0, 6));
            }}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="123 456"
            {...doneProps}
          />
        </View>
      )}

      {!linking && (
        <>
          <Text style={form.label}>Family member to call (optional)</Text>
          <TextInput style={form.input} value={carerName} onChangeText={setCarerName} placeholder="Their name, e.g. Sarah" autoCapitalize="words" {...doneProps} />
          <TextInput
            style={form.input}
            value={carerPhone}
            onChangeText={setCarerPhone}
            keyboardType="phone-pad"
            placeholder="Their phone number"
            {...doneProps}
          />
          <Text style={form.hint}>Adds a big "Call" button to the clock screen.</Text>
        </>
      )}

      <Text style={form.label}>Settings PIN (4 digits)</Text>
      <TextInput
        style={[form.input, styles.pin]}
        value={pin}
        onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
        keyboardType="number-pad"
        maxLength={4}
        {...doneProps}
      />
      <Text style={form.hint}>
        Stops settings being changed by accident. To open settings later, hold the time on the clock for 3 seconds and enter this PIN.
      </Text>

      {!!error && <Text style={form.error}>{error}</Text>}
      <Button label={busy ? 'Please wait…' : 'Start'} primary disabled={busy} onPress={finish} />
      <Pressable onPress={onBack} style={{ marginTop: 24 }}>
        <Text style={form.hint}>‹ Back</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h3: { fontSize: 18, fontWeight: '700', color: '#111' },
  code: { fontSize: 28, letterSpacing: 6, textAlign: 'center' },
  pin: { width: 140, textAlign: 'center', fontSize: 26, letterSpacing: 8 },
});

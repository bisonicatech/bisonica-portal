import { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Settings } from './schedule';
import {
  Household,
  createHousehold,
  endOut,
  familyEnabled,
  formatTime,
  getHousehold,
  registerForPush,
  startOut,
} from './family';
import { Button, form } from './ui';

type Props = {
  settings: Settings;
  onSave: (s: Settings) => void;
  onChangeRole: () => void;
};

const EVERY = [
  { minutes: 30, label: '30 min' },
  { minutes: 60, label: '1 hour' },
  { minutes: 120, label: '2 hours' },
];

/** "3pm", "3:30 pm", "15:00" → a Date today (or tomorrow if that time has passed). */
export function parseBackTime(text: string, now = new Date()): Date | null {
  const m = /^(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?$/i.exec(text.trim());
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  const ampm = m[3]?.toLowerCase();
  if (min > 59 || h > 23 || (ampm && (h < 1 || h > 12))) return null;
  if (ampm === 'pm' && h < 12) h += 12;
  if (ampm === 'am' && h === 12) h = 0;
  const d = new Date(now);
  d.setHours(h, min, 0, 0);
  if (d <= now) d.setDate(d.getDate() + 1);
  return d;
}

const defaultBackTime = () => {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  return formatTime(d);
};

const outMessage = (carer: string, back: Date | null) =>
  `${carer || 'Your family'} has gone out${back ? ` and will be back at ${formatTime(back)}` : ''}. ` +
  'Have a cup of tea and watch the TV. Please don\'t use the cooker.';

export default function FamilyScreen({ settings, onSave, onChangeRole }: Props) {
  const code = settings.householdCode;
  const [household, setHousehold] = useState<Household | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!code) return;
    try {
      setHousehold(await getHousehold(code));
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, [code]);

  useEffect(() => {
    if (!code) return;
    refresh();
    registerForPush(code, 'carer').catch(() => {});
    const t = setInterval(refresh, 20_000);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => {
      clearInterval(t);
      sub.remove();
    };
  }, [code, refresh]);

  const run = async (fn: () => Promise<Household>) => {
    setBusy(true);
    try {
      setHousehold(await fn());
      setError('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!familyEnabled) {
    return (
      <View style={[form.root, form.center]}>
        <Text style={form.h1}>Family link not set up</Text>
        <Text style={[form.hint, { textAlign: 'center' }]}>
          This copy of DayGuide isn't connected to a server yet, so Out mode and check-ins aren't available. See the README.
        </Text>
        <Button label="Change what this phone is for" onPress={onChangeRole} />
      </View>
    );
  }

  if (!code) return <Setup settings={settings} onSave={onSave} onChangeRole={onChangeRole} />;

  const patient = household?.patient_name || settings.name;
  const carer = household?.carer_name || settings.carerName;

  return (
    <ScrollView style={form.root} contentContainerStyle={{ paddingBottom: 60 }}>
      <Text style={form.h1}>{patient}</Text>

      {!household ? (
        <Text style={form.hint}>{error || 'Loading…'}</Text>
      ) : household.is_out ? (
        <OutStatus household={household} patient={patient} busy={busy} onHome={() => run(() => endOut(code))} />
      ) : (
        <GoOut carer={carer} patient={patient} busy={busy} onStart={(back, msg, every) => run(() => startOut(code, back, msg, every))} />
      )}

      {!!error && !!household && <Text style={form.error}>{error}</Text>}

      <View style={[form.card, { marginTop: 32 }]}>
        <Text style={form.label}>Code for {patient}'s phone</Text>
        <Text style={styles.code} selectable>
          {code}
        </Text>
        <Text style={form.hint}>
          On {patient}'s phone: hold the top-right corner of the clock for 3 seconds, enter the PIN, and type this into "Family code".
        </Text>
      </View>
      <Pressable onPress={onChangeRole}>
        <Text style={form.hint}>Change what this phone is for…</Text>
      </Pressable>
    </ScrollView>
  );
}

function OutStatus({ household: h, patient, busy, onHome }: { household: Household; patient: string; busy: boolean; onHome: () => void }) {
  let status: { text: string; color: string };
  if (h.missed_alert_sent) {
    status = { text: `⚠️ ${patient} hasn't answered the ${formatTime(h.checkin_due_at!)} check-in`, color: '#b3261e' };
  } else if (h.checkin_prompted) {
    status = { text: `Asked ${patient} at ${formatTime(h.checkin_due_at!)}. Waiting for a reply…`, color: '#8a5a00' };
  } else {
    status = { text: `Next check-in at ${h.checkin_due_at ? formatTime(h.checkin_due_at) : '—'}`, color: '#1f3b73' };
  }
  return (
    <>
      <View style={[form.card, styles.outCard]}>
        <Text style={styles.outTitle}>🏡 Out mode is on</Text>
        <Text style={form.hint}>{patient}'s screen says:</Text>
        <Text style={styles.quote}>“{h.out_message}”</Text>
      </View>
      <View style={form.card}>
        <Text style={[styles.status, { color: status.color }]}>{status.text}</Text>
        <Text style={form.hint}>
          {h.last_checkin_at ? `Last "I'm okay": ${formatTime(h.last_checkin_at)}` : `No "I'm okay" yet while you've been out.`}
        </Text>
      </View>
      <Pressable onPress={onHome} disabled={busy} style={[styles.big, { backgroundColor: '#1e8e3e' }]}>
        <Text style={styles.bigText}>I'm home</Text>
      </Pressable>
    </>
  );
}

function GoOut({ carer, patient, busy, onStart }: { carer: string; patient: string; busy: boolean; onStart: (back: Date, msg: string, every: number) => void }) {
  const [backText, setBackText] = useState(defaultBackTime);
  const [every, setEvery] = useState(60);
  const [custom, setCustom] = useState<string | null>(null);
  const back = parseBackTime(backText);
  const message = custom ?? outMessage(carer, back);

  return (
    <>
      <Text style={form.hint}>Out mode is off. {patient} sees the normal daily schedule.</Text>
      <Text style={form.h2}>Going out?</Text>

      <Text style={form.label}>Back by</Text>
      <TextInput style={[form.input, { width: 140 }]} value={backText} onChangeText={setBackText} placeholder="3:30 pm" />
      {!back && <Text style={form.error}>Type a time like 3pm or 15:30</Text>}

      <Text style={form.label}>Ask {patient} "Are you okay?" every</Text>
      <View style={form.row}>
        {EVERY.map((o) => (
          <Pressable key={o.minutes} onPress={() => setEvery(o.minutes)} style={[form.chip, every === o.minutes && form.chipOn]}>
            <Text style={[form.chipText, every === o.minutes && form.chipTextOn]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={form.label}>Message on {patient}'s screen</Text>
      <TextInput style={[form.input, { minHeight: 90 }]} value={message} onChangeText={setCustom} multiline />

      <Pressable
        onPress={() => back && onStart(back, message, every)}
        disabled={busy || !back}
        style={[styles.big, { backgroundColor: '#1f3b73', opacity: busy || !back ? 0.5 : 1 }]}
      >
        <Text style={styles.bigText}>Start Out mode</Text>
      </Pressable>
      <Text style={form.hint}>If {patient} doesn't tap "I'm okay" within 15 minutes, you'll get an alert.</Text>
    </>
  );
}

function Setup({ settings, onSave, onChangeRole }: Props) {
  const [mode, setMode] = useState<'new' | 'join'>('new');
  const [patient, setPatient] = useState(settings.name);
  const [carer, setCarer] = useState(settings.carerName);
  const [phone, setPhone] = useState(settings.carerPhone);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true);
    setError('');
    try {
      const h = mode === 'new' ? await createHousehold(patient, carer, phone) : await getHousehold(code);
      onSave({ ...settings, householdCode: h.code, name: h.patient_name, carerName: h.carer_name, carerPhone: h.carer_phone });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={form.root} contentContainerStyle={{ paddingBottom: 60 }}>
      <Text style={form.h1}>Family setup</Text>
      <View style={form.row}>
        <Pressable onPress={() => setMode('new')} style={[form.chip, mode === 'new' && form.chipOn]}>
          <Text style={[form.chipText, mode === 'new' && form.chipTextOn]}>Set up for the first time</Text>
        </Pressable>
        <Pressable onPress={() => setMode('join')} style={[form.chip, mode === 'join' && form.chipOn]}>
          <Text style={[form.chipText, mode === 'join' && form.chipTextOn]}>I have a code</Text>
        </Pressable>
      </View>

      {mode === 'new' ? (
        <>
          <Text style={form.label}>Name of the person you care for</Text>
          <TextInput style={form.input} value={patient} onChangeText={setPatient} placeholder="e.g. David" />
          <Text style={form.label}>Your name</Text>
          <TextInput style={form.input} value={carer} onChangeText={setCarer} placeholder="e.g. Carrie" />
          <Text style={form.label}>Your phone number (for their Call button)</Text>
          <TextInput style={form.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </>
      ) : (
        <>
          <Text style={form.label}>Family code</Text>
          <TextInput
            style={form.input}
            value={code}
            onChangeText={(t) => setCode(t.trim().toUpperCase())}
            autoCapitalize="characters"
            placeholder="e.g. 4A5891DA82"
          />
        </>
      )}

      {!!error && <Text style={form.error}>{error}</Text>}
      <Button label={busy ? 'Please wait…' : 'Continue'} primary disabled={busy} onPress={go} />
      <Pressable onPress={onChangeRole} style={{ marginTop: 24 }}>
        <Text style={form.hint}>Change what this phone is for…</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  code: { fontSize: 30, fontWeight: '800', letterSpacing: 3, color: '#111', marginVertical: 6 },
  outCard: { backgroundColor: '#eef7ee', borderColor: '#bfe0c2' },
  outTitle: { fontSize: 20, fontWeight: '800', color: '#1e6b2f', marginBottom: 6 },
  quote: { fontSize: 17, fontStyle: 'italic', color: '#222' },
  status: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  big: { borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginTop: 16 },
  bigText: { color: '#fff', fontSize: 22, fontWeight: '800' },
});

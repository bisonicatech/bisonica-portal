import { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { DEFAULT_SETTINGS, Entry, Settings, currentEntry, fillName, scheduleError, sortEntries } from './schedule';
import ScheduleEditor from './ScheduleEditor';
import {
  FamilyError,
  Household,
  createHousehold,
  endOut,
  familyEnabled,
  formatTime,
  getHousehold,
  newLinkCode,
  redeemLinkCode,
  registerForPush,
  setSchedule,
  startOut,
} from './family';
import { Button, Screen, doneProps, form } from './ui';

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
  const [editingSchedule, setEditingSchedule] = useState(false);

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
    // Alerts go to one family phone; extra family members who joined with a code don't take them over.
    if (settings.getsAlerts !== false) registerForPush(code, 'carer').catch(() => {});
    const t = setInterval(refresh, 20_000);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => {
      clearInterval(t);
      sub.remove();
    };
  }, [code, refresh, settings.getsAlerts]);

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
      <Screen center>
        <Text style={form.h1}>Family link not set up</Text>
        <Text style={[form.hint, { textAlign: 'center' }]}>
          This copy of DayGuide isn't connected to a server yet, so Out mode and check-ins aren't available. See the README.
        </Text>
        <Button label="Change what this phone is for" onPress={onChangeRole} />
      </Screen>
    );
  }

  if (!code) return <Setup settings={settings} onSave={onSave} onChangeRole={onChangeRole} />;

  const patient = household?.patient_name || settings.name;
  const carer = household?.carer_name || settings.carerName;

  if (editingSchedule && household) {
    return (
      <ScheduleScreen
        code={code}
        household={household}
        patient={patient}
        onClose={() => setEditingSchedule(false)}
        onSaved={(h) => {
          setHousehold(h);
          setEditingSchedule(false);
        }}
      />
    );
  }

  return (
    <Screen>
      <Text style={form.h1}>{patient}</Text>
      {household && <PhoneStatus household={household} patient={patient} />}
      {household && !household.patient_seen_at && <LinkCard code={code} patient={patient} startOpen />}

      {!household ? (
        <Text style={form.hint}>{error || 'Loading…'}</Text>
      ) : household.is_out ? (
        <OutStatus household={household} patient={patient} busy={busy} onHome={() => run(() => endOut(code))} />
      ) : (
        <>
          <NowShowing household={household} patient={patient} />
          {household.schedule !== undefined && (
            <Pressable onPress={() => setEditingSchedule(true)} style={[styles.big, { backgroundColor: '#5b3fa0', marginTop: 0, marginBottom: 8 }]}>
              <Text style={styles.bigText}>📅 Edit {patient}'s daily schedule</Text>
            </Pressable>
          )}
          <GoOut carer={carer} patient={patient} busy={busy} onStart={(back, msg, every) => run(() => startOut(code, back, msg, every))} />
        </>
      )}


      {!!error && !!household && <Text style={form.error}>{error}</Text>}

      {household && !!household.patient_seen_at && <LinkCard code={code} patient={patient} />}
      <Pressable onPress={onChangeRole} style={{ marginTop: 24 }}>
        <Text style={form.hint}>Change what this phone is for…</Text>
      </Pressable>
    </Screen>
  );
}

/** What the cared-for person's screen is showing right now (from the shared schedule). */
function NowShowing({ household: h, patient }: { household: Household; patient: string }) {
  if (!h.schedule) return null;
  const entry = currentEntry(h.schedule, new Date());
  if (!entry) return null;
  return (
    <View style={form.card}>
      <Text style={form.hint}>Right now {patient}'s screen says:</Text>
      <Text style={styles.quote}>
        {entry.icon} “{fillName(entry.message, h.patient_name)}”
      </Text>
    </View>
  );
}

/** Edit the cared-for person's daily schedule from the family member's phone. */
function ScheduleScreen({
  code,
  household,
  patient,
  onClose,
  onSaved,
}: {
  code: string;
  household: Household;
  patient: string;
  onClose: () => void;
  onSaved: (h: Household) => void;
}) {
  const [entries, setEntries] = useState<Entry[]>(() => household.schedule ?? DEFAULT_SETTINGS.entries);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const bad = scheduleError(entries);
    if (bad) return setErr(bad);
    setSaving(true);
    try {
      onSaved(await setSchedule(code, sortEntries(entries)));
    } catch (e) {
      setErr(e instanceof FamilyError && e.kind === 'missing_function' ? 'The server needs updating first (0004_shared_schedule.sql).' : (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const buttons = (
    <View style={form.row}>
      <Button label="Cancel" onPress={onClose} />
      <Button label={saving ? 'Saving…' : 'Save'} primary disabled={saving} onPress={save} />
    </View>
  );

  return (
    <Screen>
      <Text style={form.h1}>{patient}'s daily schedule</Text>
      <Text style={form.hint}>Changes show on {patient}'s phone within about 15 seconds while DayGuide is open on it.</Text>
      {household.schedule === null && (
        <Text style={form.warn}>{patient}'s phone hasn't shared its schedule yet, so this starts from the standard one.</Text>
      )}
      {buttons}
      {!!err && <Text style={form.error}>{err}</Text>}
      <View style={{ height: 12 }} />
      <ScheduleEditor entries={entries} onChange={setEntries} />
      {!!err && <Text style={form.error}>{err}</Text>}
      <View style={{ marginTop: 12 }}>{buttons}</View>
    </Screen>
  );
}

/** Shows a short single-use code for linking the cared-for person's phone. */
function LinkCard({ code, patient, startOpen }: { code: string; patient: string; startOpen?: boolean }) {
  const [open, setOpen] = useState(!!startOpen);
  const [link, setLink] = useState<{ link_code: string; expires_at: string } | null>(null);
  const [legacy, setLegacy] = useState(false);
  const [err, setErr] = useState('');
  const [now, setNow] = useState(Date.now());

  const make = useCallback(async () => {
    try {
      setLink(await newLinkCode(code));
      setErr('');
    } catch (e) {
      if (e instanceof FamilyError && e.kind === 'missing_function') setLegacy(true);
      else setErr((e as Error).message);
    }
  }, [code]);

  useEffect(() => {
    if (open && !link && !legacy) make();
  }, [open, link, legacy, make]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  if (!open) {
    return (
      <Pressable onPress={() => setOpen(true)} style={{ marginTop: 32 }}>
        <Text style={[form.hint, { color: '#1f3b73', fontWeight: '600' }]}>Show a link code (for {patient}'s phone or another family member)…</Text>
      </Pressable>
    );
  }

  const expired = !!link && new Date(link.expires_at).getTime() <= now;
  const shown = legacy ? code : link ? `${link.link_code.slice(0, 3)} ${link.link_code.slice(3)}` : '… …';

  return (
    <View style={[form.card, { marginTop: 16 }]}>
      <Text style={styles.linkTitle}>Link code</Text>
      <Text style={form.hint}>
        For {patient}'s phone: hold the clock time for 3 seconds, enter the 4-digit settings PIN, type this code at the top and tap
        Save.{'\n'}
        For another family member: in DayGuide on their phone, choose "A family member or carer", then "I have a code", and type
        this code.
      </Text>
      <Text style={[styles.code, expired && { color: '#aaa', textDecorationLine: 'line-through' }]} selectable>
        {shown}
      </Text>
      {legacy ? (
        <Text style={form.warn}>The server needs updating (0003_link_codes.sql) before short codes work.</Text>
      ) : expired ? (
        <Text style={form.warn}>This code has run out. Get a new one.</Text>
      ) : link ? (
        <Text style={form.hint}>Works once, until {formatTime(link.expires_at)}. This is not the settings PIN.</Text>
      ) : null}
      {!!err && <Text style={form.error}>{err}</Text>}
      {!legacy && <Button label="Get a new code" onPress={make} />}
    </View>
  );
}

/** Whether the cared-for person's phone is linked and has connected recently. */
function PhoneStatus({ household: h, patient }: { household: Household; patient: string }) {
  if (h.patient_seen_at === undefined) return null; // server not updated yet
  if (!h.patient_seen_at) {
    return <Text style={form.warn}>⚠️ {patient}'s phone isn't linked yet.</Text>;
  }
  const mins = Math.round((Date.now() - new Date(h.patient_seen_at).getTime()) / 60000);
  if (mins <= 2) return <Text style={form.ok}>✓ {patient}'s phone is connected</Text>;
  return (
    <Text style={form.warn}>
      ⚠️ {patient}'s phone last connected at {formatTime(h.patient_seen_at)}. It may be off, offline, or the app closed.
    </Text>
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
      <TextInput style={[form.input, { width: 140 }]} value={backText} onChangeText={setBackText} placeholder="3:30 pm" {...doneProps} />
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
      <TextInput style={[form.input, { minHeight: 90 }]} value={message} onChangeText={setCustom} multiline {...doneProps} />

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
    setError('');
    if (mode === 'new' && !patient.trim()) return setError('Please type the name of the person you care for.');
    if (mode === 'new' && !carer.trim()) return setError('Please type your name.');
    setBusy(true);
    try {
      const h =
        mode === 'new' ? await createHousehold(patient, carer, phone) : /^\d{6}$/.test(code) ? await redeemLinkCode(code) : await getHousehold(code);
      // The phone that sets things up gets the alerts; family members who join with a code don't.
      onSave({
        ...settings,
        householdCode: h.code,
        name: h.patient_name,
        carerName: h.carer_name,
        carerPhone: h.carer_phone,
        getsAlerts: mode === 'new',
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
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
          <TextInput style={form.input} value={patient} onChangeText={setPatient} placeholder="e.g. Margaret, or Dad" autoCapitalize="words" {...doneProps} />
          <Text style={form.label}>Your name</Text>
          <TextInput style={form.input} value={carer} onChangeText={setCarer} placeholder="e.g. Sarah" autoCapitalize="words" {...doneProps} />
          <Text style={form.label}>Your phone number (for their Call button)</Text>
          <TextInput style={form.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" {...doneProps} />
        </>
      ) : (
        <>
          <Text style={form.label}>6-digit link code from the main family member's DayGuide</Text>
          <TextInput
            style={form.input}
            value={code}
            onChangeText={(t) => setCode(t.replace(/[^0-9a-z]/gi, '').toUpperCase())}
            keyboardType="number-pad"
            autoCapitalize="characters"
            autoCorrect={false}
            spellCheck={false}
            maxLength={10}
            placeholder="123 456"
            {...doneProps}
          />
          <Text style={form.hint}>
            On their phone, the code is under "Show a link code" at the bottom of the screen. You'll see the same information as
            them, but check-in alerts stay on their phone.
          </Text>
        </>
      )}

      {!!error && <Text style={form.error}>{error}</Text>}
      <Button label={busy ? 'Please wait…' : 'Continue'} primary disabled={busy} onPress={go} />
      <Pressable onPress={onChangeRole} style={{ marginTop: 24 }}>
        <Text style={form.hint}>Change what this phone is for…</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  code: { fontSize: 44, fontWeight: '800', letterSpacing: 4, color: '#111', marginVertical: 8, textAlign: 'center' },
  linkTitle: { fontSize: 20, fontWeight: '800', color: '#1f3b73', marginBottom: 6 },
  outCard: { backgroundColor: '#eef7ee', borderColor: '#bfe0c2' },
  outTitle: { fontSize: 20, fontWeight: '800', color: '#1e6b2f', marginBottom: 6 },
  quote: { fontSize: 17, fontStyle: 'italic', color: '#222' },
  status: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  big: { borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginTop: 16 },
  bigText: { color: '#fff', fontSize: 22, fontWeight: '800' },
});

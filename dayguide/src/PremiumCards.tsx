import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Contact, FamilyError, Household, hasPremium, sendMessage, setContacts, formatTime } from './family';
import { Button, doneProps, form } from './ui';

/** Shows which plan the household is on, with an upgrade button on the free plan. */
export function PlanCard({ household: h, onUpgrade }: { household: Household; onUpgrade: () => void }) {
  if (h.is_premium === undefined) return null; // server without plans
  if (h.comp) return <Text style={form.ok}>⭐ Premium, free for life</Text>;
  if (h.is_premium) {
    return (
      <Text style={form.ok}>
        ⭐ Premium{h.premium_until ? ` until ${new Date(h.premium_until).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
      </Text>
    );
  }
  return (
    <Pressable onPress={onUpgrade} style={styles.upgrade}>
      <Text style={styles.upgradeText}>Free plan · ⭐ Try Premium free for a month</Text>
    </Pressable>
  );
}

/** A small "needs Premium" card used in place of a Premium feature. */
export function Locked({ title, text, onUpgrade }: { title: string; text: string; onUpgrade: () => void }) {
  return (
    <View style={[form.card, styles.locked]}>
      <Text style={styles.h3}>⭐ {title}</Text>
      <Text style={form.hint}>{text}</Text>
      <Pressable onPress={onUpgrade}>
        <Text style={styles.linkText}>See Premium ›</Text>
      </Pressable>
    </View>
  );
}

const DURATIONS = [
  { minutes: 30, label: '30 min' },
  { minutes: 60, label: '1 hour' },
  { minutes: 180, label: '3 hours' },
  { minutes: 720, label: '12 hours' },
];

/** Premium: put a one-off message on the cared-for person's screen. */
export function MessageCard({
  code,
  household: h,
  patient,
  onUpdate,
  onUpgrade,
}: {
  code: string;
  household: Household;
  patient: string;
  onUpdate: (h: Household) => void;
  onUpgrade: () => void;
}) {
  const [text, setText] = useState('');
  const [minutes, setMinutes] = useState(60);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (!hasPremium(h)) {
    return <Locked title={`Send a message to ${patient}'s screen`} text='e.g. "Sara is coming at 2pm" or "Taxi to the doctor at 10:30".' onUpgrade={onUpgrade} />;
  }

  const send = async (message: string) => {
    setBusy(true);
    setErr('');
    try {
      onUpdate(await sendMessage(code, message, minutes));
      setText('');
    } catch (e) {
      setErr(e instanceof FamilyError && e.kind === 'premium_required' ? 'This needs Clocka Premium.' : (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={form.card}>
      <Text style={styles.h3}>💬 Message on {patient}'s screen</Text>
      {h.adhoc_message ? (
        <>
          <Text style={styles.quote}>“{h.adhoc_message}”</Text>
          <Text style={form.hint}>Showing until {formatTime(h.adhoc_until!)}.</Text>
          <Button label="Remove message" onPress={() => send('')} disabled={busy} />
        </>
      ) : (
        <Text style={form.hint}>Shows on {patient}'s screen instead of the usual message, for as long as you choose.</Text>
      )}
      <TextInput
        style={[form.input, { minHeight: 70, marginTop: 10 }]}
        value={text}
        onChangeText={setText}
        multiline
        placeholder="e.g. Sara is coming to see you at 2pm."
        {...doneProps}
      />
      <Text style={form.label}>Show it for</Text>
      <View style={form.row}>
        {DURATIONS.map((d) => (
          <Pressable key={d.minutes} onPress={() => setMinutes(d.minutes)} style={[form.chip, minutes === d.minutes && form.chipOn]}>
            <Text style={[form.chipText, minutes === d.minutes && form.chipTextOn]}>{d.label}</Text>
          </Pressable>
        ))}
      </View>
      {!!err && <Text style={form.error}>{err}</Text>}
      <Button label={busy ? 'Sending…' : 'Send to their screen'} primary disabled={busy || !text.trim()} onPress={() => send(text)} />
    </View>
  );
}

/** Premium: extra call buttons and a video call button on the cared-for screen. */
export function ContactsCard({
  code,
  household: h,
  patient,
  onUpdate,
  onUpgrade,
}: {
  code: string;
  household: Household;
  patient: string;
  onUpdate: (h: Household) => void;
  onUpgrade: () => void;
}) {
  const [contacts, setList] = useState<Contact[]>(h.contacts ?? []);
  const [videoName, setVideoName] = useState(h.video_contact?.name ?? '');
  const [videoHandle, setVideoHandle] = useState(h.video_contact?.handle ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  if (!hasPremium(h)) {
    return <Locked title="Extra call buttons and a video call button" text={`More people ${patient} can call with one tap, plus a FaceTime video call button.`} onUpgrade={onUpgrade} />;
  }

  const change = (i: number, patch: Partial<Contact>) => setList(contacts.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  const save = async () => {
    setBusy(true);
    setMsg('');
    try {
      const clean = contacts.map((c) => ({ name: c.name.trim(), phone: c.phone.trim() })).filter((c) => c.name && c.phone);
      const video = videoName.trim() && videoHandle.trim() ? { name: videoName.trim(), handle: videoHandle.trim() } : null;
      const updated = await setContacts(code, clean, video);
      setList(updated.contacts ?? []);
      onUpdate(updated);
      setMsg('Saved ✓');
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={form.card}>
      <Text style={styles.h3}>📞 Call buttons on {patient}'s screen</Text>
      <Text style={form.hint}>The main family member's button is always there. Add more people here.</Text>
      {contacts.map((c, i) => (
        <View key={i} style={[form.row, { flexWrap: 'nowrap' }]}>
          <TextInput style={[form.input, { flex: 1 }]} value={c.name} onChangeText={(name) => change(i, { name })} placeholder="Name" {...doneProps} />
          <TextInput
            style={[form.input, { flex: 1.3 }]}
            value={c.phone}
            onChangeText={(phone) => change(i, { phone })}
            placeholder="Phone number"
            keyboardType="phone-pad"
            {...doneProps}
          />
          <Pressable onPress={() => setList(contacts.filter((_, j) => j !== i))} hitSlop={8}>
            <Text style={styles.remove}>✕</Text>
          </Pressable>
        </View>
      ))}
      {contacts.length < 4 && <Button label="+ Add a call button" onPress={() => setList([...contacts, { name: '', phone: '' }])} />}

      <Text style={[styles.h3, { marginTop: 18 }]}>🎥 Video call button</Text>
      <Text style={form.hint}>One tap starts a FaceTime video call. Use their iPhone number or Apple ID email.</Text>
      <TextInput style={form.input} value={videoName} onChangeText={setVideoName} placeholder="Name, e.g. Sara" autoCapitalize="words" {...doneProps} />
      <TextInput
        style={form.input}
        value={videoHandle}
        onChangeText={setVideoHandle}
        placeholder="iPhone number or Apple ID email"
        autoCapitalize="none"
        keyboardType="email-address"
        {...doneProps}
      />
      {!!msg && <Text style={msg.startsWith('Saved') ? form.ok : form.error}>{msg}</Text>}
      <Button label={busy ? 'Saving…' : 'Save call buttons'} primary disabled={busy} onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  h3: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 4 },
  quote: { fontSize: 17, fontStyle: 'italic', color: '#222', marginVertical: 4 },
  upgrade: { backgroundColor: '#fff6da', borderColor: '#f0d58a', borderWidth: 1, borderRadius: 10, padding: 10, marginTop: 6 },
  upgradeText: { color: '#6b4e00', fontWeight: '700', fontSize: 15 },
  locked: { backgroundColor: '#fbfaf4', borderColor: '#efe6c6' },
  linkText: { color: '#1f3b73', fontWeight: '700', marginTop: 6, fontSize: 16 },
  remove: { fontSize: 20, color: '#c0392b', paddingHorizontal: 6 },
});

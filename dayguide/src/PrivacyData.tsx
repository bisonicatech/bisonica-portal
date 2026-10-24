import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { PRIVACY_URL } from './purchases';
import { Button, Screen, form } from './ui';

const SUMMARY: [string, string][] = [
  [
    'What Clocka keeps',
    'First names, the family member\'s phone number, the daily schedule and its messages, Out mode and check-in times, any extra call buttons, and whether the household has Premium.',
  ],
  [
    'Where',
    'On your phones, and on Clocka\'s secure server so linked phones can share it. Notifications go through Apple and Expo. Subscriptions are handled by Apple and RevenueCat.',
  ],
  ['What Clocka doesn\'t do', 'No adverts, no tracking, no location, no selling or sharing your information for marketing.'],
  [
    'Deleting',
    'The family member who set Clocka up can delete everything at any time from their phone. Households nobody uses for 12 months are deleted automatically.',
  ],
];

/** Plain-English privacy summary, with a link to the full policy when there is one. */
export function PrivacyScreen({ onClose }: { onClose: () => void }) {
  return (
    <Screen>
      <Pressable onPress={onClose} hitSlop={12}>
        <Text style={[form.hint, styles.link]}>‹ Back</Text>
      </Pressable>
      <Text style={form.h1}>Privacy</Text>
      {SUMMARY.map(([title, text]) => (
        <View key={title} style={{ marginTop: 12 }}>
          <Text style={styles.h3}>{title}</Text>
          <Text style={form.hint}>{text}</Text>
        </View>
      ))}
      {!!PRIVACY_URL && (
        <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} style={{ marginTop: 16 }}>
          <Text style={[form.hint, styles.link]}>Read the full privacy policy ›</Text>
        </Pressable>
      )}
    </Screen>
  );
}

type DataCardProps = {
  patient: string;
  /** The family member who set Clocka up can delete the whole household; anyone else can only remove it from their phone. */
  canDeleteAll: boolean;
  onDeleteAll: () => Promise<void>;
  onRemoveHere: () => void;
  onPrivacy: () => void;
};

/** "Privacy and your data" card for the family member's phone. */
export function DataCard({ patient, canDeleteAll, onDeleteAll, onRemoveHere, onPrivacy }: DataCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const doDelete = async () => {
    setBusy(true);
    setErr('');
    try {
      await onDeleteAll();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <View style={[form.card, { marginTop: 24 }]}>
      <Text style={styles.h3}>Privacy and your data</Text>
      <Pressable onPress={onPrivacy}>
        <Text style={[form.hint, styles.link]}>What Clocka keeps and why ›</Text>
      </Pressable>

      {!confirming ? (
        <Pressable onPress={() => setConfirming(true)} style={{ marginTop: 8 }}>
          <Text style={styles.danger}>{canDeleteAll ? `Delete all of ${patient}'s Clocka data…` : 'Remove Clocka from this phone…'}</Text>
        </Pressable>
      ) : (
        <View style={styles.confirm}>
          {canDeleteAll ? (
            <>
              <Text style={styles.h3}>Delete everything?</Text>
              <Text style={form.hint}>
                This permanently deletes {patient}'s schedule, messages, call buttons and family links from Clocka's server. {patient}'s
                phone and any other family phones will stop being linked. This can't be undone.
              </Text>
              <Text style={form.hint}>
                If you pay for Premium, deleting doesn't cancel it: cancel in the iPhone's Settings › your name › Subscriptions.
              </Text>
            </>
          ) : (
            <Text style={form.hint}>
              This removes Clocka's information from this phone only. {patient}'s schedule stays as it is for the rest of the family.
            </Text>
          )}
          {!!err && <Text style={form.error}>{err}</Text>}
          <View style={form.row}>
            <Button label="Cancel" onPress={() => setConfirming(false)} disabled={busy} />
            <Pressable
              onPress={canDeleteAll ? doDelete : onRemoveHere}
              disabled={busy}
              style={[form.button, styles.dangerButton, busy && { opacity: 0.5 }]}
            >
              <Text style={[form.buttonText, { color: '#fff' }]}>{busy ? 'Deleting…' : canDeleteAll ? 'Yes, delete everything' : 'Remove'}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  h3: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 4 },
  link: { color: '#1f3b73', fontWeight: '600' },
  danger: { color: '#b3261e', fontWeight: '700', fontSize: 16, marginTop: 6 },
  confirm: { marginTop: 10, padding: 12, borderRadius: 10, backgroundColor: '#fff3f2', borderWidth: 1, borderColor: '#f3c1bc' },
  dangerButton: { backgroundColor: '#b3261e' },
});

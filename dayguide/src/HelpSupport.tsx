import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { Screen, form } from './ui';

const SUPPORT_EMAIL = 'info@clocka.co.uk';
const SUPPORT_PAGE = 'https://clocka.co.uk/support/';

type Org = { name: string; what: string; phone?: string; phoneLabel?: string; web: string };

// UK organisations. Opening hours change, so the app shows numbers and websites only.
const ORGS: Org[] = [
  {
    name: "Alzheimer's Society",
    what: 'Dementia Support Line: information, advice and emotional support for anyone affected by dementia.',
    phone: '03331503456',
    phoneLabel: '0333 150 3456',
    web: 'https://www.alzheimers.org.uk',
  },
  {
    name: 'Dementia UK',
    what: 'Admiral Nurse Dementia Helpline: free advice from specialist dementia nurses.',
    phone: '08008886678',
    phoneLabel: '0800 888 6678',
    web: 'https://www.dementiauk.org',
  },
  {
    name: 'Carers UK',
    what: 'Advice and support for you, the person doing the caring.',
    phone: '08088087777',
    phoneLabel: '0808 808 7777',
    web: 'https://www.carersuk.org',
  },
  {
    name: 'Age UK',
    what: 'Advice Line for older people and their families: care, money and practical help.',
    phone: '08006781602',
    phoneLabel: '0800 678 1602',
    web: 'https://www.ageuk.org.uk',
  },
  {
    name: 'NHS: dementia guide',
    what: 'Living with dementia, getting a diagnosis, and care and support.',
    web: 'https://www.nhs.uk/conditions/dementia/',
  },
];

const ANSWERS: [string, string][] = [
  [
    'Linking the two phones',
    'On the family phone, tap "Show a link code". On the other phone, hold the clock time for 3 seconds, enter the PIN, type the 8-digit code and tap Save. Codes last 15 minutes.',
  ],
  ['Forgotten the settings PIN', 'Delete Clocka from that phone and install it again, then link it to the family phone again. The shared schedule comes back.'],
  ['Cancelling Premium', "On the iPhone, open Settings, tap your name, then Subscriptions, then Clocka. On Android, open Google Play › Payments & subscriptions."],
  ['Reminders not making a sound', "Check the phone isn't on silent or Do Not Disturb, and that notifications for Clocka are allowed in the phone's Settings. Night-time messages are always silent."],
];

const appVersion = () => Constants.expoConfig?.version ?? '';

function emailUs() {
  const body = `\n\n---\nApp version ${appVersion()} on ${Platform.OS} ${Platform.Version}`;
  Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Clocka help')}&body=${encodeURIComponent(body)}`).catch(() => {});
}

const open = (url: string) => Linking.openURL(url).catch(() => {});

/** Help and support: contact Clocka, quick answers, and UK dementia organisations. */
export function HelpScreen({ onClose }: { onClose: () => void }) {
  return (
    <Screen>
      <Pressable onPress={onClose} hitSlop={12}>
        <Text style={[form.hint, styles.link]}>‹ Back</Text>
      </Pressable>
      <Text style={form.h1}>Help and support</Text>

      <View style={form.card}>
        <Text style={styles.h3}>Contact Clocka</Text>
        <Text style={form.hint}>Questions, problems or ideas? We're a small team and read every message.</Text>
        <Pressable onPress={emailUs} style={[form.button, form.buttonPrimary]}>
          <Text style={[form.buttonText, { color: '#fff' }]}>✉️ Email {SUPPORT_EMAIL}</Text>
        </Pressable>
        <Pressable onPress={() => open(SUPPORT_PAGE)} style={{ marginTop: 10 }}>
          <Text style={[form.hint, styles.link]}>More help at clocka.co.uk/support ›</Text>
        </Pressable>
      </View>

      <Text style={form.h2}>Quick answers</Text>
      {ANSWERS.map(([q, a]) => (
        <View key={q} style={{ marginTop: 10 }}>
          <Text style={styles.h4}>{q}</Text>
          <Text style={form.hint}>{a}</Text>
        </View>
      ))}

      <Text style={form.h2}>Dementia help and advice</Text>
      <Text style={form.hint}>Free and independent UK organisations. Clocka isn't connected to them.</Text>
      {ORGS.map((o) => (
        <View key={o.name} style={form.card}>
          <Text style={styles.h3}>{o.name}</Text>
          <Text style={form.hint}>{o.what}</Text>
          <View style={form.row}>
            {o.phone && (
              <Pressable onPress={() => open(`tel:${o.phone}`)} style={[form.button, styles.callButton]}>
                <Text style={[form.buttonText, { color: '#fff' }]}>📞 {o.phoneLabel}</Text>
              </Pressable>
            )}
            <Pressable onPress={() => open(o.web)} style={form.button}>
              <Text style={form.buttonText}>Website</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <View style={[form.card, styles.emergency]}>
        <Text style={styles.h3}>Urgent help</Text>
        <Text style={form.hint}>In an emergency, call 999. For urgent medical advice, call NHS 111.</Text>
        <Text style={form.hint}>Clocka is a reminder app, not an emergency alarm or a medical device.</Text>
      </View>
      {!!appVersion() && <Text style={[form.hint, { textAlign: 'center', marginTop: 12 }]}>Clocka {appVersion()}</Text>}
    </Screen>
  );
}

/** A small "Help and support" entry point for the settings and family screens. */
export function HelpLink({ onOpen }: { onOpen: () => void }) {
  return (
    <Pressable onPress={onOpen} style={[form.card, styles.helpLink]}>
      <Text style={styles.h3}>🤝 Help and support</Text>
      <Text style={form.hint}>Contact Clocka, quick answers, and dementia helplines.</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  h3: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 4 },
  h4: { fontSize: 16, fontWeight: '700', color: '#1f3b73' },
  link: { color: '#1f3b73', fontWeight: '600' },
  callButton: { backgroundColor: '#1e8e3e' },
  emergency: { backgroundColor: '#fff3f2', borderColor: '#f3c1bc', marginTop: 8 },
  helpLink: { marginTop: 24 },
});

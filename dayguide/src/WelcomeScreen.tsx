import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Role } from './schedule';
import { form } from './ui';

export default function WelcomeScreen({ onChoose }: { onChoose: (role: Role) => void }) {
  return (
    <View style={[form.root, form.center]}>
      <Text style={form.h1}>Welcome to DayGuide</Text>
      <Text style={[form.hint, { textAlign: 'center', fontSize: 17 }]}>Who will use this phone?</Text>
      <Pressable style={styles.choice} onPress={() => onChoose('patient')}>
        <Text style={styles.choiceIcon}>🕰️</Text>
        <Text style={styles.choiceTitle}>The person being cared for</Text>
        <Text style={styles.choiceText}>Shows the time and what to do now.</Text>
      </Pressable>
      <Pressable style={styles.choice} onPress={() => onChoose('carer')}>
        <Text style={styles.choiceIcon}>👪</Text>
        <Text style={styles.choiceTitle}>A family member or carer</Text>
        <Text style={styles.choiceText}>Turn on Out mode and get check-in alerts.</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  choice: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginTop: 16, width: '100%', maxWidth: 420, alignItems: 'center', borderWidth: 1, borderColor: '#e2e4ea' },
  choiceIcon: { fontSize: 40 },
  choiceTitle: { fontSize: 20, fontWeight: '800', color: '#1f3b73', marginTop: 6, textAlign: 'center' },
  choiceText: { fontSize: 15, color: '#555', marginTop: 4, textAlign: 'center' },
});

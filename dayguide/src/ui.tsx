import { Pressable, StyleSheet, Text } from 'react-native';

export function Button({ label, onPress, primary, disabled }: { label: string; onPress: () => void; primary?: boolean; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[form.button, primary && form.buttonPrimary, disabled && { opacity: 0.5 }]}>
      <Text style={[form.buttonText, primary && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

/** Shared styles for the family-facing screens. */
export const form = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f7f9', padding: 20, paddingTop: 60 },
  center: { alignItems: 'center', justifyContent: 'center' },
  h1: { fontSize: 26, fontWeight: '800', marginBottom: 12, color: '#111' },
  h2: { fontSize: 20, fontWeight: '700', marginTop: 24, color: '#111' },
  hint: { color: '#555', marginBottom: 12, marginTop: 4 },
  label: { fontSize: 15, color: '#333', marginTop: 12, marginBottom: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccd', borderRadius: 8, padding: 10, fontSize: 17, marginVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e4ea' },
  chip: { borderWidth: 1, borderColor: '#99a', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  chipOn: { backgroundColor: '#1f3b73', borderColor: '#1f3b73' },
  chipText: { color: '#333' },
  chipTextOn: { color: '#fff' },
  button: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, backgroundColor: '#e3e6ee', marginTop: 8 },
  buttonPrimary: { backgroundColor: '#1f3b73' },
  buttonText: { fontSize: 17, fontWeight: '700', color: '#1f3b73' },
  error: { color: '#c0392b', marginTop: 10, fontSize: 15 },
});

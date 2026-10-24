import { ReactNode } from 'react';
import { InputAccessoryView, Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DONE_ID = 'keyboard-done';

/** Spread onto every TextInput so iPhone keyboards (including number pads) get a Done button. */
export const doneProps = Platform.OS === 'ios' ? { inputAccessoryViewID: DONE_ID } : {};

/**
 * Page wrapper for the family-facing screens: starts just below the notch,
 * scrolls, and keeps the focused field above the keyboard.
 */
export function Screen({ children, center }: { children: ReactNode; center?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <>
      <ScrollView
        style={form.screen}
        contentContainerStyle={[
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40, paddingHorizontal: 20 },
          center && { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        {children}
      </ScrollView>
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={DONE_ID}>
          <View style={form.doneBar}>
            <Pressable onPress={Keyboard.dismiss} hitSlop={12}>
              <Text style={form.doneText}>Done</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}
    </>
  );
}

export function Button({ label, onPress, primary, disabled }: { label: string; onPress: () => void; primary?: boolean; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[form.button, primary && form.buttonPrimary, disabled && { opacity: 0.5 }]}>
      <Text style={[form.buttonText, primary && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

/** Shared styles for the family-facing screens. */
export const form = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6f7f9' },
  doneBar: { backgroundColor: '#e9ebef', borderTopWidth: 1, borderColor: '#cfd3da', paddingHorizontal: 16, paddingVertical: 10, alignItems: 'flex-end' },
  doneText: { fontSize: 18, fontWeight: '700', color: '#1f3b73' },
  center: { alignItems: 'center', justifyContent: 'center' },
  h1: { fontSize: 26, fontWeight: '800', marginBottom: 8, color: '#111' },
  ok: { color: '#1e6b2f', fontSize: 15, fontWeight: '600', marginTop: 2 },
  warn: { color: '#8a5a00', fontSize: 15, fontWeight: '600', marginTop: 2 },
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

import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Entry, Mode, newId } from './schedule';
import { Button, doneProps, form } from './ui';

const MODES: { mode: Mode; label: string }[] = [
  { mode: 'morning', label: 'Morning' },
  { mode: 'day', label: 'Day' },
  { mode: 'evening', label: 'Evening' },
  { mode: 'night', label: 'Night (silent)' },
];

/** Edit the daily list of times and messages. Used on both phones. */
export default function ScheduleEditor({ entries, onChange }: { entries: Entry[]; onChange: (entries: Entry[]) => void }) {
  const update = (id: string, patch: Partial<Entry>) => onChange(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const remove = (id: string) => onChange(entries.filter((e) => e.id !== id));
  const add = () => onChange([...entries, { id: newId(), time: '12:00', mode: 'day', sound: true, icon: '🙂', message: '' }]);

  return (
    <>
      <Text style={form.hint}>
        Each message shows from its time until the next one. Times are 24-hour, e.g. 07:30 or 21:00. Night messages never make
        a sound. Use {'{name}'} in a message to put the name in.
      </Text>

      {entries.map((e) => (
        <View key={e.id} style={form.card}>
          <View style={form.row}>
            <TextInput style={[form.input, styles.time]} value={e.time} onChangeText={(time) => update(e.id, { time })} placeholder="07:00" {...doneProps} />
            <TextInput style={[form.input, styles.icon]} value={e.icon} onChangeText={(icon) => update(e.id, { icon })} {...doneProps} />
            <Pressable onPress={() => remove(e.id)} style={styles.delete}>
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          </View>
          <TextInput
            style={[form.input, { minHeight: 60 }]}
            value={e.message}
            onChangeText={(message) => update(e.id, { message })}
            multiline
            placeholder="What should he do now?"
            {...doneProps}
          />
          <View style={styles.modes}>
            {MODES.map((m) => (
              <Pressable key={m.mode} onPress={() => update(e.id, { mode: m.mode })} style={[form.chip, e.mode === m.mode && form.chipOn]}>
                <Text style={[form.chipText, e.mode === m.mode && form.chipTextOn]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
          {e.mode !== 'night' && (
            <View style={form.row}>
              <Switch value={e.sound} onValueChange={(sound) => update(e.id, { sound })} />
              <Text style={styles.switchLabel}>Reminder sound at this time</Text>
            </View>
          )}
        </View>
      ))}

      <Button label="+ Add a time" onPress={add} />
    </>
  );
}

const styles = StyleSheet.create({
  time: { width: 90, textAlign: 'center' },
  icon: { width: 60, textAlign: 'center' },
  delete: { marginLeft: 'auto', padding: 8 },
  deleteText: { color: '#c0392b', fontWeight: '600' },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 6 },
  switchLabel: { fontSize: 15, color: '#333' },
});

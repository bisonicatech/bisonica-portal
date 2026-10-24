import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { DAY_NAMES, Entry, FREE_MAX_TIMES, Mode, isDaySpecific, newId } from './schedule';
import { Button, doneProps, form } from './ui';

const MODES: { mode: Mode; label: string }[] = [
  { mode: 'morning', label: 'Morning' },
  { mode: 'day', label: 'Day' },
  { mode: 'evening', label: 'Evening' },
  { mode: 'night', label: 'Night (silent)' },
];

/** Edit the daily list of times and messages. Used on both phones. */
type Props = {
  entries: Entry[];
  onChange: (entries: Entry[]) => void;
  /** Premium: unlimited times and different times on different days. */
  premium: boolean;
  /** Shown on the free plan when a Premium feature is reached. Omit where upgrading isn't possible. */
  onUpgrade?: () => void;
};

export default function ScheduleEditor({ entries, onChange, premium, onUpgrade }: Props) {
  const atLimit = !premium && entries.length >= FREE_MAX_TIMES;
  const toggleDay = (e: Entry, day: number) => {
    // From "Every day", tapping a day means "only this day"; after that, taps add or remove days.
    const current = isDaySpecific(e) ? e.days! : [];
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort();
    // All days (or none) means every day.
    update(e.id, { days: next.length === 0 || next.length === 7 ? undefined : next });
  };
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
            placeholder="What should they do now?"
            {...doneProps}
          />
          <View style={styles.modes}>
            {MODES.map((m) => (
              <Pressable key={m.mode} onPress={() => update(e.id, { mode: m.mode })} style={[form.chip, e.mode === m.mode && form.chipOn]}>
                <Text style={[form.chipText, e.mode === m.mode && form.chipTextOn]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
          {premium ? (
            <View style={styles.modes}>
              <Pressable onPress={() => update(e.id, { days: undefined })} style={[styles.day, !isDaySpecific(e) && form.chipOn]}>
                <Text style={[form.chipText, !isDaySpecific(e) && form.chipTextOn]}>Every day</Text>
              </Pressable>
              {DAY_NAMES.map((d, i) => {
                const on = isDaySpecific(e) && e.days!.includes(i);
                return (
                  <Pressable key={d} onPress={() => toggleDay(e, i)} style={[styles.day, on && form.chipOn]}>
                    <Text style={[form.chipText, on && form.chipTextOn]}>{d}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            isDaySpecific(e) && <Text style={form.warn}>Only on {e.days!.map((d) => DAY_NAMES[d]).join(', ')} (Premium).</Text>
          )}
          {e.mode !== 'night' && (
            <View style={form.row}>
              <Switch value={e.sound} onValueChange={(sound) => update(e.id, { sound })} />
              <Text style={styles.switchLabel}>Reminder sound at this time</Text>
            </View>
          )}
        </View>
      ))}

      {atLimit ? (
        <View style={[form.card, styles.limit]}>
          <Text style={form.hint}>The free plan has up to {FREE_MAX_TIMES} times a day, the same every day.</Text>
          {onUpgrade ? (
            <Pressable onPress={onUpgrade}>
              <Text style={styles.upgrade}>⭐ Premium: unlimited times, different days ›</Text>
            </Pressable>
          ) : (
            <Text style={form.hint}>The main family member can upgrade to Premium for more.</Text>
          )}
        </View>
      ) : (
        <Button label="+ Add a time" onPress={add} />
      )}
      {!premium && onUpgrade && !atLimit && (
        <Pressable onPress={onUpgrade}>
          <Text style={styles.upgrade}>⭐ Different times on different days? See Premium ›</Text>
        </Pressable>
      )}
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
  day: { borderWidth: 1, borderColor: '#99a', borderRadius: 14, paddingVertical: 5, paddingHorizontal: 9 },
  limit: { backgroundColor: '#fbfaf4', borderColor: '#efe6c6', marginTop: 8 },
  upgrade: { color: '#1f3b73', fontWeight: '700', fontSize: 15, marginTop: 10 },
});

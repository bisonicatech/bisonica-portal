export type Mode = 'night' | 'morning' | 'day' | 'evening';

export type Entry = {
  id: string;
  /** 24-hour "HH:MM" */
  time: string;
  message: string;
  icon: string;
  mode: Mode;
  /** Play a reminder sound at this time. Always ignored for night entries. */
  sound: boolean;
};

export type Role = 'patient' | 'carer';

export type Settings = {
  /** What this phone is for. Unset until chosen on first launch. */
  role?: Role;
  /** The person being cared for. */
  name: string;
  /** The family member who looks after them. */
  carerName: string;
  /** Used by the "Call" button on the clock screen. */
  carerPhone: string;
  /** Links this phone to the other one (see src/family.ts). */
  householdCode: string;
  pin: string;
  entries: Entry[];
};

let counter = 0;
export const newId = () => `${Date.now().toString(36)}-${(counter++).toString(36)}`;

export const DEFAULT_SETTINGS: Settings = {
  name: 'David',
  carerName: 'Carrie',
  carerPhone: '',
  householdCode: '',
  pin: '1234',
  entries: [
    { id: 'e1', time: '07:00', mode: 'morning', sound: true, icon: '☀️', message: 'Good morning{name}! Time to get up and get dressed.' },
    { id: 'e2', time: '08:00', mode: 'morning', sound: true, icon: '🍳', message: 'Time for breakfast.' },
    { id: 'e3', time: '10:00', mode: 'day', sound: false, icon: '☕', message: 'Time for a cup of tea. Maybe read the paper.' },
    { id: 'e4', time: '12:30', mode: 'day', sound: true, icon: '🍽️', message: 'Time for lunch.' },
    { id: 'e5', time: '15:00', mode: 'day', sound: false, icon: '🚶', message: 'A good time for a short walk or a sit in the garden.' },
    { id: 'e6', time: '18:00', mode: 'evening', sound: true, icon: '🍲', message: 'Time for dinner.' },
    { id: 'e7', time: '21:00', mode: 'evening', sound: true, icon: '🛁', message: 'Time to get ready for bed.' },
    { id: 'e8', time: '22:00', mode: 'night', sound: false, icon: '🌙', message: "It's night-time. Time to sleep." },
    { id: 'e9', time: '00:30', mode: 'night', sound: false, icon: '🌙', message: "It's still night-time. Everyone is asleep. Go back to bed." },
  ],
};

export const parseTime = (t: string): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
};

export const sortEntries = (entries: Entry[]) =>
  [...entries].sort((a, b) => (parseTime(a.time) ?? 0) - (parseTime(b.time) ?? 0));

/** The entry that applies right now: the latest one at or before now, wrapping round from yesterday. */
export function currentEntry(entries: Entry[], now: Date): Entry | null {
  const valid = sortEntries(entries.filter((e) => parseTime(e.time) !== null));
  if (valid.length === 0) return null;
  const mins = now.getHours() * 60 + now.getMinutes();
  let found = valid[valid.length - 1];
  for (const e of valid) {
    if ((parseTime(e.time) as number) <= mins) found = e;
  }
  return found;
}

export function periodLabel(now: Date, mode: Mode | undefined): string {
  if (mode === 'night') return 'NIGHT-TIME';
  const h = now.getHours();
  if (h < 5) return 'NIGHT-TIME';
  if (h < 12) return 'MORNING';
  if (h < 17) return 'AFTERNOON';
  return 'EVENING';
}

export const fillName = (message: string, name: string) =>
  message.replace(/\{name\}/g, name.trim() ? `, ${name.trim()}` : '');

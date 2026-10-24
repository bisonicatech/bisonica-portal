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
  /** Days this applies on (0 = Sunday … 6 = Saturday). Missing or empty = every day. Premium. */
  days?: number[];
};

/** Free plan limit on daily times. */
export const FREE_MAX_TIMES = 8;

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** True if the entry applies on this weekday (0 = Sunday). */
export const activeOn = (e: Entry, weekday: number) => !e.days || e.days.length === 0 || e.days.includes(weekday);

/** True if the entry is limited to some days of the week. */
export const isDaySpecific = (e: Entry) => !!e.days && e.days.length > 0 && e.days.length < 7;

export type Role = 'patient' | 'carer';

export type Settings = {
  /** What this phone is for. Unset until chosen on first launch. */
  role?: Role;
  /** First-run setup finished on the cared-for person's phone. */
  setupDone?: boolean;
  /** Family member's phone: receive check-in alerts here. False for extra family members who joined with a code. */
  getsAlerts?: boolean;
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
  /** Server time of the shared schedule this phone last saw (cared-for phone only). */
  scheduleUpdatedAt?: string;
  /** A schedule edit made on this phone that hasn't reached the server yet. */
  schedulePending?: boolean;
};

let counter = 0;
export const newId = () => `${Date.now().toString(36)}-${(counter++).toString(36)}`;

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  carerName: '',
  carerPhone: '',
  householdCode: '',
  pin: '1234',
  entries: [
    { id: 'e1', time: '07:00', mode: 'morning', sound: true, icon: '☀️', message: 'Good morning{name}! Time to get up and get dressed.' },
    { id: 'e2', time: '08:00', mode: 'morning', sound: true, icon: '🍳', message: 'Time for breakfast.' },
    { id: 'e3', time: '10:00', mode: 'day', sound: false, icon: '☕', message: 'Time for a cup of tea. Maybe read the paper.' },
    { id: 'e4', time: '12:30', mode: 'day', sound: true, icon: '🍽️', message: 'Time for lunch.' },
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

/**
 * The entry that applies right now: the latest one at or before now today,
 * otherwise the last one on an earlier day (looking back up to a week).
 */
export function currentEntry(entries: Entry[], now: Date): Entry | null {
  const valid = sortEntries(entries.filter((e) => parseTime(e.time) !== null));
  if (valid.length === 0) return null;
  const mins = now.getHours() * 60 + now.getMinutes();
  for (let back = 0; back <= 7; back++) {
    const weekday = (now.getDay() - back + 7) % 7;
    const candidates = valid.filter((e) => activeOn(e, weekday) && (back > 0 || (parseTime(e.time) as number) <= mins));
    if (candidates.length) return candidates[candidates.length - 1];
  }
  return null;
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

/** A message explaining what's wrong with a schedule, or null if it's fine. */
export function scheduleError(entries: Entry[]): string | null {
  const bad = entries.find((e) => parseTime(e.time) === null);
  if (bad) return `"${bad.time}" isn't a valid time. Use 24-hour HH:MM, e.g. 07:30 or 21:00.`;
  return null;
}

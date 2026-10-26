import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { Entry } from './schedule';

// Links the cared-for person's phone with a family member's phone through
// Supabase (see supabase/migrations). Without these two values the app works
// on its own and the family features are hidden.
const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const familyEnabled = !!(URL && KEY);

export type Household = {
  /** Not a secret; used as the RevenueCat customer ID. Missing before 0009_security.sql. */
  id?: string;
  code: string;
  patient_name: string;
  carer_name: string;
  carer_phone: string;
  is_out: boolean;
  out_message: string;
  back_at: string | null;
  checkin_every_minutes: number;
  checkin_grace_minutes: number;
  checkin_due_at: string | null;
  checkin_prompted: boolean;
  missed_alert_sent: boolean;
  last_checkin_at: string | null;
  /** Last time the cared-for person's phone connected. Missing if 0002_patient_seen.sql hasn't been run. */
  patient_seen_at?: string | null;
  /** Shared daily schedule. null = never shared yet; missing = server needs 0004_shared_schedule.sql. */
  schedule?: Entry[] | null;
  schedule_updated_at?: string | null;
  /** Plans (0005_premium.sql). Missing on older servers, which behave as Premium. */
  is_premium?: boolean;
  /** Free for life. */
  comp?: boolean;
  premium_until?: string | null;
  /** One-off message for the cared-for screen (only while it's current). */
  adhoc_message?: string | null;
  adhoc_until?: string | null;
  /** Extra call buttons. */
  contacts?: Contact[];
  /** One person to video call (FaceTime). */
  video_contact?: VideoContact | null;
  family_count?: number;
};

export type Contact = { name: string; phone: string };
export type VideoContact = { name: string; handle: string };

/** Whether Premium features are available. Servers without plans count as Premium so nothing breaks. */
export const hasPremium = (h: Household | null | undefined) => !!h && h.is_premium !== false;

export class FamilyError extends Error {
  constructor(message: string, public kind: 'not_found' | 'missing_function' | 'network' | 'premium_required' | 'member_limit' | 'too_many_attempts') {
    super(message);
  }
}

/** Turn a server error message into a FamilyError the screens can show. */
function serverError(text: string): FamilyError {
  if (text.includes('household_not_found')) return new FamilyError("That code wasn't found. Check it and try again.", 'not_found');
  if (text.includes('link_code_not_found')) {
    return new FamilyError("That link code isn't right or has run out. Get a new one on the family member's phone.", 'not_found');
  }
  if (text.includes('too_many_attempts')) {
    return new FamilyError('Too many tries. Please wait 15 minutes and try again.', 'too_many_attempts');
  }
  if (text.includes('premium_required')) return new FamilyError('This needs Clocka Premium.', 'premium_required');
  if (text.includes('member_limit')) {
    return new FamilyError(
      'The free plan includes one family member. The main family member can upgrade to Premium to add more people.',
      'member_limit',
    );
  }
  if (text.includes('PGRST202')) return new FamilyError('Server needs updating.', 'missing_function');
  return new FamilyError('Could not reach the server. Check the internet connection.', 'network');
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  if (!familyEnabled) throw new Error('Family link is not set up');
  let res: Response;
  try {
    res = await fetch(`${URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: KEY!,
      // Legacy anon keys are JWTs and also go in Authorization; new publishable keys (sb_publishable_…) must not.
      ...(KEY!.startsWith('eyJ') ? { Authorization: `Bearer ${KEY}` } : {}),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
    });
  } catch {
    throw new FamilyError('Could not reach the server. Check the internet connection.', 'network');
  }
  const text = await res.text();
  if (!res.ok) throw serverError(text);
  const data = text ? JSON.parse(text) : null;
  // Link code functions answer {"error": "..."} so the server can count wrong tries.
  if (data && typeof data === 'object' && !Array.isArray(data) && typeof data.error === 'string') throw serverError(data.error);
  return data as T;
}

export const createHousehold = (patientName: string, carerName: string, carerPhone: string) =>
  rpc<Household>('dg_create_household', { p_patient_name: patientName, p_carer_name: carerName, p_carer_phone: carerPhone });

export const getHousehold = (code: string) => rpc<Household>('dg_get_household', { p_code: code });

/** Used by the cared-for person's phone: fetches the household and records that the phone is connected. */
export async function getHouseholdAsPatient(code: string): Promise<Household> {
  try {
    return await rpc<Household>('dg_patient_seen', { p_code: code });
  } catch (e) {
    // Older server without dg_patient_seen: fall back to a plain read.
    if (e instanceof FamilyError && e.kind === 'missing_function') return getHousehold(code);
    throw e;
  }
}

/** Family member's phone: a new single-use 8-digit code for linking the cared-for phone (lasts 15 minutes). */
export const newLinkCode = (code: string) =>
  rpc<{ link_code: string; expires_at: string }>('dg_new_link_code', { p_code: code });

/** Cared-for person's phone: swap a 8-digit link code for the household. */
export const redeemLinkCode = (linkCode: string) => rpc<Household>('dg_use_link_code', { p_link_code: linkCode });

/** Either phone: replace the shared daily schedule. */
export const setSchedule = (code: string, entries: Entry[]) =>
  rpc<Household>('dg_set_schedule', { p_code: code, p_schedule: entries });

/** Another family member joins with a 8-digit link code (Premium allows more than one). */
export async function joinFamily(linkCode: string, name: string): Promise<Household> {
  try {
    return await rpc<Household>('dg_join_family', { p_link_code: linkCode, p_name: name });
  } catch (e) {
    // Older server without plans.
    if (e instanceof FamilyError && e.kind === 'missing_function') return redeemLinkCode(linkCode);
    throw e;
  }
}

/** Record the household's Premium end date after a purchase or restore. */
export const setPremium = (code: string, until: Date) => rpc<Household>('dg_set_premium', { p_code: code, p_until: until.toISOString() });

/** Premium: show a one-off message on the cared-for screen for a while (empty message clears it). */
export const sendMessage = (code: string, message: string, minutes: number) =>
  rpc<Household>('dg_send_message', { p_code: code, p_message: message, p_minutes: minutes });

/** Premium: extra call buttons and the video call contact. */
export const setContacts = (code: string, contacts: Contact[], video: VideoContact | null) =>
  rpc<Household>('dg_set_contacts', { p_code: code, p_contacts: contacts, p_video_contact: video });

/** Delete everything about this household from the server (the family member who set it up). */
export const deleteHousehold = (code: string) => rpc<null>('dg_delete_household', { p_code: code });

export const updateHousehold = (code: string, patientName: string, carerName: string, carerPhone: string) =>
  rpc<Household>('dg_update_household', { p_code: code, p_patient_name: patientName, p_carer_name: carerName, p_carer_phone: carerPhone });

export const startOut = (code: string, backAt: Date, message: string, everyMinutes: number) =>
  rpc<Household>('dg_start_out', { p_code: code, p_back_at: backAt.toISOString(), p_message: message, p_every_minutes: everyMinutes });

export const endOut = (code: string) => rpc<Household>('dg_end_out', { p_code: code });

export const checkIn = (code: string) => rpc<Household>('dg_check_in', { p_code: code });

/** Register this phone so the server can send it check-in prompts or alerts. */
export async function registerForPush(code: string, role: 'patient' | 'carer') {
  if (Platform.OS === 'web' || !familyEnabled) return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('family-alerts', {
      name: 'Family alerts',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
  const perm = await Notifications.requestPermissionsAsync();
  if (!perm.granted) return;
  const token = await Notifications.getExpoPushTokenAsync();
  await rpc('dg_set_push_token', { p_code: code, p_role: role, p_token: token.data });
}

/** True when the cared-for person should be asked "Are you okay?" right now. */
export const checkInDue = (h: Household | null, now: Date) =>
  !!h?.is_out && !!h.checkin_due_at && new Date(h.checkin_due_at) <= now;

export const formatTime = (iso: string | Date) =>
  new Date(iso)
    .toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(/\s?(am|pm)/i, (m) => ' ' + m.trim().toLowerCase());

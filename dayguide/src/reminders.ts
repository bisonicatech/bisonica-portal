import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Settings, fillName, isDaySpecific, parseTime } from './schedule';

const CHANNEL = 'daily-prompts';

// Show reminders even when the app is open.
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Replace all scheduled reminders with the current schedule.
 * Night-time entries never get a reminder, so the phone stays silent at night.
 */
export async function syncReminders(settings: Settings): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const perm = await Notifications.requestPermissionsAsync();
  if (!perm.granted) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Daily prompts',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  await Notifications.cancelAllScheduledNotificationsAsync();

  // iPhones keep at most 64 scheduled reminders, so stop a little short of that.
  let budget = 60;
  for (const e of settings.entries) {
    const mins = parseTime(e.time);
    if (mins === null || e.mode === 'night' || !e.sound) continue;
    const content = {
      title: `${e.icon}  ${fillName(e.message, settings.name)}`,
      body: 'Tap to see what to do now.',
      sound: 'default',
    };
    const hour = Math.floor(mins / 60);
    const minute = mins % 60;
    if (!isDaySpecific(e)) {
      if (budget-- <= 0) break;
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: CHANNEL },
      });
      continue;
    }
    for (const day of e.days!) {
      if (budget-- <= 0) break;
      await Notifications.scheduleNotificationAsync({
        content,
        // Expo counts weekdays from 1 = Sunday.
        trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: day + 1, hour, minute, channelId: CHANNEL },
      });
    }
  }
  return true;
}

/** Remove daily reminders, e.g. when this phone is a family member's phone. */
export async function clearReminders() {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

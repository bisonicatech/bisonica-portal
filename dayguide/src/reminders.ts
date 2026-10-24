import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Settings, fillName, parseTime } from './schedule';

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

  for (const e of settings.entries) {
    const mins = parseTime(e.time);
    if (mins === null || e.mode === 'night' || !e.sound) continue;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${e.icon}  ${fillName(e.message, settings.name)}`,
        body: 'Tap to see what to do now.',
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: Math.floor(mins / 60),
        minute: mins % 60,
        channelId: CHANNEL,
      },
    });
  }
  return true;
}

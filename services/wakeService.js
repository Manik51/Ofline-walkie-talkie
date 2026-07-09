import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

const BACKGROUND_WAKE_TASK = 'MESH_BACKGROUND_WAKE';

// Runs when a data push arrives, even if app is backgrounded/killed-but-registered.
// This is OS-visible — it shows in the app's battery & background activity stats.
TaskManager.defineTask(BACKGROUND_WAKE_TASK, async ({ data, error }) => {
  if (error) {
    console.log('Wake task error:', error);
    return;
  }
  // Example: refresh mesh peer list, check pending relay messages, etc.
  console.log('MeshTalk woke up from push:', data);
  // TODO: hook this into your mesh peer-refresh logic
});

export async function registerForPushWakeAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push permission denied — wake-up disabled.');
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('mesh-wake', {
      name: 'Mesh Wake Signals',
      importance: Notifications.AndroidImportance.LOW,
    });
  }

  await Notifications.registerTaskAsync(BACKGROUND_WAKE_TASK);

  return token; // send this to your server/relay so it can wake this device
}

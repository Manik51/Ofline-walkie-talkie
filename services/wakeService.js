import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

const BACKGROUND_WAKE_TASK = 'MESH_BACKGROUND_WAKE';

TaskManager.defineTask(BACKGROUND_WAKE_TASK, async ({ data, error }) => {
  if (error) {
    console.log('Wake task error:', error);
    return;
  }
  console.log('MeshTalk woke up from push:', data);
});

export async function registerForPushWakeAsync() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('mesh-wake', {
        name: 'Mesh Wake Signals',
        importance: Notifications.AndroidImportance.LOW,
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    await Notifications.registerTaskAsync(BACKGROUND_WAKE_TASK);
    return tokenData.data;
  } catch (err) {
    // FCM credentials not configured yet, or device/network issue —
    // fail gracefully instead of hanging forever.
    console.log('Push wake registration failed:', err.message);
    return null;
  }
}

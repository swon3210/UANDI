import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

export type FcmPlatform = 'android' | 'ios';

export type FcmTokenInfo = {
  token: string;
  platform: FcmPlatform;
  userAgent: string;
};

const ANDROID_DEFAULT_CHANNEL_ID = 'default';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_DEFAULT_CHANNEL_ID, {
    name: '기본 알림',
    importance: Notifications.AndroidImportance.DEFAULT,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

function userAgentFor(platform: FcmPlatform): string {
  return platform === 'android' ? 'UANDI-Mobile/Android' : 'UANDI-Mobile/iOS';
}

export async function requestPermissionAndGetToken(): Promise<FcmTokenInfo | null> {
  if (Platform.OS !== 'android') return null;
  if (!Device.isDevice) return null;

  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.status === 'granted';
  if (!granted) {
    const requested = await Notifications.requestPermissionsAsync();
    granted = requested.status === 'granted';
  }
  if (!granted) return null;

  await ensureAndroidChannel();

  try {
    // Android에서 expo-notifications의 device push token은 google-services.json이 연결된 경우
    // FCM registration token을 반환한다 (DevicePushToken.type === 'android', data === FCM token string).
    const devicePushToken = await Notifications.getDevicePushTokenAsync();
    if (devicePushToken.type !== 'android') return null;
    const tokenString = typeof devicePushToken.data === 'string' ? devicePushToken.data : null;
    if (!tokenString) return null;
    const platform: FcmPlatform = 'android';
    return { token: tokenString, platform, userAgent: userAgentFor(platform) };
  } catch (e) {
    console.warn('[fcm] getDevicePushTokenAsync failed', e);
    return null;
  }
}

export function subscribeTokenChange(cb: (info: FcmTokenInfo) => void): () => void {
  const sub = Notifications.addPushTokenListener((event) => {
    if (Platform.OS !== 'android') return;
    if (event.type !== 'android') return;
    const tokenString = typeof event.data === 'string' ? event.data : null;
    if (!tokenString) return;
    const platform: FcmPlatform = 'android';
    cb({ token: tokenString, platform, userAgent: userAgentFor(platform) });
  });
  return () => sub.remove();
}

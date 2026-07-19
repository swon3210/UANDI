import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import {
  getMessaging,
  getToken,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
} from '@react-native-firebase/messaging';

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

async function ensureNotificationPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

// iOS는 expo-notifications의 getDevicePushTokenAsync가 원시 APNs 토큰만 반환해
// 백엔드(firebase-admin, FCM send)와 호환되지 않는다. @react-native-firebase/messaging으로
// APNs 등록 후 FCM registration token을 받아, Android와 동일한 토큰 스토어/발송 경로를 쓴다.
async function requestPermissionAndGetTokenIos(): Promise<FcmTokenInfo | null> {
  if (!Device.isDevice) return null;
  if (!(await ensureNotificationPermission())) return null;

  try {
    const messaging = getMessaging();
    // APNs 토큰을 FIRMessaging에 연결한다(idempotent). 이후 getToken이 FCM 토큰을 반환.
    await registerDeviceForRemoteMessages(messaging);
    const token = await getToken(messaging);
    if (!token) return null;
    const platform: FcmPlatform = 'ios';
    return { token, platform, userAgent: userAgentFor(platform) };
  } catch (e) {
    console.warn('[fcm] ios getToken failed', e);
    return null;
  }
}

export async function requestPermissionAndGetToken(): Promise<FcmTokenInfo | null> {
  if (Platform.OS === 'ios') return requestPermissionAndGetTokenIos();
  if (Platform.OS !== 'android') return null;
  if (!Device.isDevice) return null;

  if (!(await ensureNotificationPermission())) return null;

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
  if (Platform.OS === 'ios') {
    // FCM 토큰이 갱신되면(앱 재설치/토큰 회전) 새 토큰을 통지해 유저 문서를 갱신한다.
    return onTokenRefresh(getMessaging(), (token) => {
      if (!token) return;
      const platform: FcmPlatform = 'ios';
      cb({ token, platform, userAgent: userAgentFor(platform) });
    });
  }

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

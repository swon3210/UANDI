import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import type { NotificationSettings } from '@/types';

function notificationSettingsDoc(userId: string) {
  return doc(getDb(), `users/${userId}/settings/notifications`);
}

export async function getNotificationSettings(
  userId: string
): Promise<NotificationSettings | null> {
  const snap = await getDoc(notificationSettingsDoc(userId));
  if (!snap.exists()) return null;
  return snap.data() as NotificationSettings;
}

export async function updateNotificationSettings(
  userId: string,
  data: {
    coupleId: string;
    recordReminder: NotificationSettings['recordReminder'];
    budgetWarning: NotificationSettings['budgetWarning'];
  }
): Promise<void> {
  await setDoc(
    notificationSettingsDoc(userId),
    {
      ...data,
      userId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

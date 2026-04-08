import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import type { CashbookDisplaySettings } from '@/types';

function cashbookDisplaySettingsDoc(userId: string) {
  return doc(getDb(), `users/${userId}/settings/cashbookDisplay`);
}

export async function getCashbookDisplaySettings(
  userId: string
): Promise<CashbookDisplaySettings | null> {
  const snap = await getDoc(cashbookDisplaySettingsDoc(userId));
  if (!snap.exists()) return null;
  return snap.data() as CashbookDisplaySettings;
}

export async function updateCashbookDisplaySettings(
  userId: string,
  data: { backgroundImageUrl: string | null }
): Promise<void> {
  await setDoc(
    cashbookDisplaySettingsDoc(userId),
    {
      ...data,
      userId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

import dayjs from 'dayjs';
import { adminDb } from './firebase-admin';

const DAILY_LIMIT = 50;

/**
 * 커플 단위 일일 AI 사용량을 확인하고 카운터를 증가시킨다.
 * 한도 초과 시 false를 반환한다.
 */
export async function checkAndIncrementUsage(
  coupleId: string
): Promise<boolean> {
  const today = dayjs().format('YYYY-MM-DD');
  const docRef = adminDb()
    .collection('couples')
    .doc(coupleId)
    .collection('meta')
    .doc('aiUsage');

  const doc = await docRef.get();
  const data = doc.data();

  if (data?.date === today && data?.count >= DAILY_LIMIT) {
    return false;
  }

  if (data?.date === today) {
    await docRef.update({ count: (data.count as number) + 1 });
  } else {
    await docRef.set({ date: today, count: 1 });
  }

  return true;
}

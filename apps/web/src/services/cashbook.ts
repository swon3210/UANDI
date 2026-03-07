import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import dayjs from 'dayjs';
import { getDb } from '@/lib/firebase/config';
import type { CashbookEntry } from '@/types';

export async function getMonthlyEntries(
  coupleId: string,
  year: number,
  month: number
): Promise<CashbookEntry[]> {
  const start = dayjs().year(year).month(month).startOf('month').toDate();
  const end = dayjs().year(year).month(month).endOf('month').toDate();

  const q = query(
    collection(getDb(), `couples/${coupleId}/cashbookEntries`),
    where('date', '>=', Timestamp.fromDate(start)),
    where('date', '<=', Timestamp.fromDate(end)),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => doc.data() as CashbookEntry);
}

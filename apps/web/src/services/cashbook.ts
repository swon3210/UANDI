import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import dayjs from 'dayjs';
import { getDb } from '@/lib/firebase/config';
import type { CashbookEntry } from '@/types';

function entriesCol(coupleId: string) {
  return collection(getDb(), `couples/${coupleId}/cashbookEntries`);
}

export async function getMonthlyEntries(
  coupleId: string,
  year: number,
  month: number
): Promise<CashbookEntry[]> {
  const start = dayjs().year(year).month(month).startOf('month').toDate();
  const end = dayjs().year(year).month(month).endOf('month').toDate();

  const q = query(
    entriesCol(coupleId),
    where('date', '>=', Timestamp.fromDate(start)),
    where('date', '<=', Timestamp.fromDate(end)),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CashbookEntry);
}

export async function addEntry(
  coupleId: string,
  data: Omit<CashbookEntry, 'id' | 'coupleId' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(entriesCol(coupleId), {
    ...data,
    coupleId,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateEntry(
  coupleId: string,
  entryId: string,
  data: Partial<Pick<CashbookEntry, 'type' | 'amount' | 'category' | 'description' | 'date'>>
): Promise<void> {
  const ref = doc(getDb(), `couples/${coupleId}/cashbookEntries/${entryId}`);
  await updateDoc(ref, data);
}

export async function deleteEntry(coupleId: string, entryId: string): Promise<void> {
  const ref = doc(getDb(), `couples/${coupleId}/cashbookEntries/${entryId}`);
  await deleteDoc(ref);
}

export async function countEntriesByCategory(
  coupleId: string,
  categoryName: string
): Promise<number> {
  const q = query(entriesCol(coupleId), where('category', '==', categoryName));
  const snap = await getDocs(q);
  return snap.size;
}

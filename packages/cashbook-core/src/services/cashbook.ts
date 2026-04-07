import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getCountFromServer,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  type Firestore,
} from 'firebase/firestore';
import dayjs from 'dayjs';
import type { CashbookEntry } from '../types.js';

function entriesCol(db: Firestore, coupleId: string) {
  return collection(db, `couples/${coupleId}/cashbookEntries`);
}

/** @param month 0-indexed (0 = 1월). dayjs().month() 값을 그대로 전달. */
export async function getMonthlyEntries(
  db: Firestore,
  coupleId: string,
  year: number,
  month: number
): Promise<CashbookEntry[]> {
  const start = dayjs().year(year).month(month).startOf('month').toDate();
  const end = dayjs().year(year).month(month).endOf('month').toDate();

  const q = query(
    entriesCol(db, coupleId),
    where('date', '>=', Timestamp.fromDate(start)),
    where('date', '<=', Timestamp.fromDate(end)),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CashbookEntry);
}

export async function addEntry(
  db: Firestore,
  coupleId: string,
  data: Omit<CashbookEntry, 'id' | 'coupleId' | 'createdAt'> & Record<string, unknown>
): Promise<string> {
  const docRef = await addDoc(entriesCol(db, coupleId), {
    ...data,
    coupleId,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateEntry(
  db: Firestore,
  coupleId: string,
  entryId: string,
  data: Partial<Pick<CashbookEntry, 'type' | 'amount' | 'category' | 'description' | 'date'>>
): Promise<void> {
  const ref = doc(db, `couples/${coupleId}/cashbookEntries/${entryId}`);
  await updateDoc(ref, data);
}

export async function deleteEntry(
  db: Firestore,
  coupleId: string,
  entryId: string
): Promise<void> {
  const ref = doc(db, `couples/${coupleId}/cashbookEntries/${entryId}`);
  await deleteDoc(ref);
}

export async function countEntriesByCategory(
  db: Firestore,
  coupleId: string,
  categoryName: string
): Promise<number> {
  const q = query(entriesCol(db, coupleId), where('category', '==', categoryName));
  const snap = await getCountFromServer(q);
  return snap.data().count;
}

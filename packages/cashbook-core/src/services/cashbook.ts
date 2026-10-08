import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getCountFromServer,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  Timestamp,
  type Firestore,
} from 'firebase/firestore';
import dayjs from 'dayjs';
import type { CashbookEntry } from '../types';
import { toWonAmount } from '../utils/currency';

const MAX_BATCH_WRITES = 500;

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
  return getEntriesInRange(db, coupleId, start, end);
}

export async function getEntriesInRange(
  db: Firestore,
  coupleId: string,
  start: Date,
  end: Date
): Promise<CashbookEntry[]> {
  const q = query(
    entriesCol(db, coupleId),
    where('date', '>=', Timestamp.fromDate(start)),
    where('date', '<=', Timestamp.fromDate(end)),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const entry = { id: d.id, ...d.data() } as CashbookEntry;
    // 과거에 소수 금액으로 저장된 내역도 합산·표기에서 원 단위로 다룬다.
    return { ...entry, amount: toWonAmount(entry.amount) };
  });
}

/**
 * 가장 최근 내역의 날짜를 돌려준다(없으면 null).
 * "마지막 내역 기준 N개월" 같은 창(window)의 기준점으로 쓴다 — 오늘 기준이 아니라서
 * 입력이 오래 끊겨 있어도 과거 패턴을 계속 참고할 수 있다.
 */
export async function getLatestEntryDate(db: Firestore, coupleId: string): Promise<Date | null> {
  const q = query(entriesCol(db, coupleId), orderBy('date', 'desc'), limit(1));
  const snap = await getDocs(q);
  const first = snap.docs[0];
  if (!first) return null;
  return (first.data() as CashbookEntry).date.toDate();
}

export async function addEntry(
  db: Firestore,
  coupleId: string,
  data: Omit<CashbookEntry, 'id' | 'coupleId' | 'createdAt'> & Record<string, unknown>
): Promise<string> {
  const docRef = await addDoc(entriesCol(db, coupleId), {
    ...data,
    amount: toWonAmount(data.amount),
    coupleId,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function addEntries(
  db: Firestore,
  coupleId: string,
  entries: Array<Omit<CashbookEntry, 'id' | 'coupleId' | 'createdAt'> & Record<string, unknown>>
): Promise<number> {
  if (entries.length === 0) return 0;
  const createdAt = Timestamp.now();
  // Firestore writeBatch는 한 번에 최대 500건. 스크린샷 다건 파싱은 이를 넘을 수 있어 분할한다.
  for (let i = 0; i < entries.length; i += MAX_BATCH_WRITES) {
    const batch = writeBatch(db);
    for (const data of entries.slice(i, i + MAX_BATCH_WRITES)) {
      const ref = doc(entriesCol(db, coupleId));
      batch.set(ref, { ...data, amount: toWonAmount(data.amount), coupleId, createdAt });
    }
    await batch.commit();
  }
  return entries.length;
}

export async function updateEntry(
  db: Firestore,
  coupleId: string,
  entryId: string,
  data: Partial<Pick<CashbookEntry, 'type' | 'amount' | 'category' | 'description' | 'date'>>
): Promise<void> {
  const ref = doc(db, `couples/${coupleId}/cashbookEntries/${entryId}`);
  await updateDoc(
    ref,
    data.amount === undefined ? data : { ...data, amount: toWonAmount(data.amount) }
  );
}

export async function deleteEntry(db: Firestore, coupleId: string, entryId: string): Promise<void> {
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

const BULK_WRITE_CHUNK = 500;

export async function bulkUpdateEntriesCategory(
  db: Firestore,
  coupleId: string,
  entryIds: string[],
  newCategoryName: string
): Promise<number> {
  if (entryIds.length === 0) return 0;
  for (let i = 0; i < entryIds.length; i += BULK_WRITE_CHUNK) {
    const chunk = entryIds.slice(i, i + BULK_WRITE_CHUNK);
    const batch = writeBatch(db);
    for (const id of chunk) {
      batch.update(doc(db, `couples/${coupleId}/cashbookEntries/${id}`), {
        category: newCategoryName,
      });
    }
    await batch.commit();
  }
  return entryIds.length;
}

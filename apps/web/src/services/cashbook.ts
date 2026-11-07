import {
  getMonthlyEntries as _getMonthlyEntries,
  getEntriesInRange as _getEntriesInRange,
  getLatestEntryDate as _getLatestEntryDate,
  addEntry as _addEntry,
  addEntries as _addEntries,
  updateEntry as _updateEntry,
  deleteEntry as _deleteEntry,
  countEntriesByCategory as _countEntriesByCategory,
  bulkUpdateEntriesCategory as _bulkUpdateEntriesCategory,
} from '@uandi/cashbook-core';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from 'firebase/firestore';
import type { CashbookEntry } from '@/types';
import { getDb } from '@/lib/firebase/config';

/** @param month 0-indexed (0 = 1월). dayjs().month() 값을 그대로 전달. */
export async function getMonthlyEntries(
  coupleId: string,
  year: number,
  month: number
): Promise<CashbookEntry[]> {
  return _getMonthlyEntries(getDb(), coupleId, year, month);
}

export async function getEntriesInRange(
  coupleId: string,
  start: Date,
  end: Date
): Promise<CashbookEntry[]> {
  return _getEntriesInRange(getDb(), coupleId, start, end);
}

export async function getLatestEntryDate(coupleId: string): Promise<Date | null> {
  return _getLatestEntryDate(getDb(), coupleId);
}

/**
 * 가장 최근에 만들어진 내역 1건을 실시간으로 구독한다(없으면 null).
 * 기간 내역 전체를 실시간으로 받는 대신, 최신 1건의 변화를 신호로 삼아 쿼리를 무효화하는 데 쓴다
 * (`CashbookLiveSync`). hasPendingWrites는 내 로컬 쓰기(서버 확정 전)를 구분하기 위해 함께 넘긴다.
 */
export function subscribeToLatestEntry(
  coupleId: string,
  onChange: (latest: CashbookEntry | null, hasPendingWrites: boolean) => void
): Unsubscribe {
  const q = query(
    collection(getDb(), `couples/${coupleId}/cashbookEntries`),
    orderBy('createdAt', 'desc'),
    limit(1)
  );
  return onSnapshot(q, (snap) => {
    const first = snap.docs[0];
    onChange(
      first
        ? ({ ...(first.data() as Omit<CashbookEntry, 'id'>), id: first.id } as CashbookEntry)
        : null,
      snap.metadata.hasPendingWrites
    );
  });
}

export async function addEntry(
  coupleId: string,
  data: Omit<CashbookEntry, 'id' | 'coupleId' | 'createdAt'> & Record<string, unknown>
): Promise<string> {
  return _addEntry(getDb(), coupleId, data);
}

export async function addEntries(
  coupleId: string,
  entries: Array<Omit<CashbookEntry, 'id' | 'coupleId' | 'createdAt'> & Record<string, unknown>>
): Promise<number> {
  return _addEntries(getDb(), coupleId, entries);
}

export async function updateEntry(
  coupleId: string,
  entryId: string,
  data: Partial<Pick<CashbookEntry, 'type' | 'amount' | 'category' | 'description' | 'date'>>
): Promise<void> {
  return _updateEntry(getDb(), coupleId, entryId, data);
}

export async function deleteEntry(coupleId: string, entryId: string): Promise<void> {
  return _deleteEntry(getDb(), coupleId, entryId);
}

export async function countEntriesByCategory(
  coupleId: string,
  categoryName: string
): Promise<number> {
  return _countEntriesByCategory(getDb(), coupleId, categoryName);
}

export async function bulkUpdateEntriesCategory(
  coupleId: string,
  entryIds: string[],
  newCategoryName: string
): Promise<number> {
  return _bulkUpdateEntriesCategory(getDb(), coupleId, entryIds, newCategoryName);
}

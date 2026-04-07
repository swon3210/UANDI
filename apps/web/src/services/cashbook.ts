import {
  getMonthlyEntries as _getMonthlyEntries,
  addEntry as _addEntry,
  updateEntry as _updateEntry,
  deleteEntry as _deleteEntry,
  countEntriesByCategory as _countEntriesByCategory,
} from '@uandi/cashbook-core';
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

export async function addEntry(
  coupleId: string,
  data: Omit<CashbookEntry, 'id' | 'coupleId' | 'createdAt'> & Record<string, unknown>
): Promise<string> {
  return _addEntry(getDb(), coupleId, data);
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

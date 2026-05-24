import dayjs from 'dayjs';
import type { CashbookEntry } from '@/types';

export type DuplicateCandidate = {
  amount: number;
  date: string; // YYYY-MM-DD
};

export type DuplicateMatch = {
  existingId: string;
  existingDate: string; // YYYY-MM-DD
};

/** amount가 일치하고 날짜가 같은 기존 내역을 찾는다. */
export function findDuplicate(
  parsed: DuplicateCandidate,
  existing: CashbookEntry[]
): DuplicateMatch | null {
  for (const e of existing) {
    if (e.amount !== parsed.amount) continue;
    const eDate = dayjs(e.date.toDate()).format('YYYY-MM-DD');
    if (eDate !== parsed.date) continue;
    return { existingId: e.id, existingDate: eDate };
  }
  return null;
}

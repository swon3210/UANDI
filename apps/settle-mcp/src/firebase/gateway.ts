import dayjs from 'dayjs';
import { Timestamp, type Firestore } from 'firebase/firestore';
import {
  addEntriesReturningIds,
  deleteEntry,
  getCategories,
  getEntriesInRange,
  getEntry,
} from '@uandi/cashbook-core';
import type { CategorySummary, EntryType, ExistingEntry } from '../core/types';

export type NewEntry = {
  type: EntryType;
  amount: number;
  category: string;
  /** 별칭 치환이 끝난 적요 */
  description: string;
  /** YYYY-MM-DD */
  date: string;
};

/**
 * 도구 계층이 Firestore를 보는 유일한 창. 테스트에서는 가짜 구현을 주입한다.
 * coupleId·uid는 로그인 세션에서 고정되고 입력으로 받지 않는다.
 */
export interface CashbookGateway {
  /** start~end(YYYY-MM-DD, 양 끝 포함)의 기존 내역을 중복 대조용 최소 형태로 */
  getExistingEntries(start: string, end: string): Promise<ExistingEntry[]>;
  getCategories(): Promise<CategorySummary[]>;
  /** 생성된 문서 ID 배열 */
  addEntries(entries: NewEntry[]): Promise<string[]>;
  /** 문서의 createdBy. 문서가 없으면 null */
  getEntryCreator(entryId: string): Promise<string | null>;
  deleteEntry(entryId: string): Promise<void>;
}

export function createFirestoreGateway(
  db: Firestore,
  coupleId: string,
  uid: string
): CashbookGateway {
  return {
    async getExistingEntries(start, end) {
      const entries = await getEntriesInRange(
        db,
        coupleId,
        dayjs(start).startOf('day').toDate(),
        dayjs(end).endOf('day').toDate()
      );
      return entries.map((e) => ({
        id: e.id,
        date: dayjs(e.date.toDate()).format('YYYY-MM-DD'),
        amount: e.amount,
      }));
    },

    async getCategories() {
      const categories = await getCategories(db, coupleId);
      const nameById = new Map(categories.map((c) => [c.id, c.name]));
      return categories.map((c) => ({
        name: c.name,
        group: c.group,
        subGroup: c.subGroup,
        parent: c.parentCategoryId ? (nameById.get(c.parentCategoryId) ?? null) : null,
        description: c.description ?? '',
        examples: c.examples ?? [],
      }));
    },

    addEntries(entries) {
      return addEntriesReturningIds(
        db,
        coupleId,
        entries.map((e) => ({
          type: e.type,
          amount: e.amount,
          category: e.category,
          description: e.description,
          date: Timestamp.fromDate(dayjs(e.date).startOf('day').toDate()),
          createdBy: uid,
        }))
      );
    },

    async getEntryCreator(entryId) {
      const entry = await getEntry(db, coupleId, entryId);
      return entry?.createdBy ?? null;
    },

    deleteEntry(entryId) {
      return deleteEntry(db, coupleId, entryId);
    },
  };
}

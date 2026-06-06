import {
  collection,
  doc,
  writeBatch,
  Timestamp,
  type Firestore,
} from 'firebase/firestore';
import {
  getPredictionsInRange as _getPredictionsInRange,
  getActivePredictions as _getActivePredictions,
  addPrediction as _addPrediction,
  updatePrediction as _updatePrediction,
  deletePrediction as _deletePrediction,
  getPredictionByRecurrenceKey as _getPredictionByRecurrenceKey,
} from '@uandi/cashbook-core';
import type { CashbookEntry, CashbookPrediction } from '@/types';
import { getDb } from '@/lib/firebase/config';

/** ✗ 거절 시 같은 패턴을 재제안하지 않을 기간(일). SYNC-04 / §7-1. */
export const REJECT_SUPPRESSION_DAYS = 30;

/** ✎ 수정 후 확정(시나리오 E)에서 덮어쓸 값. 미지정 필드는 예측값을 그대로 사용. */
export type ConfirmOverride = Partial<
  Pick<CashbookEntry, 'type' | 'amount' | 'category' | 'description' | 'date'>
>;

export function getPredictionsInRange(
  coupleId: string,
  start: Date,
  end: Date
): Promise<CashbookPrediction[]> {
  return _getPredictionsInRange(getDb(), coupleId, start, end);
}

export function getActivePredictions(coupleId: string, from: Date): Promise<CashbookPrediction[]> {
  return _getActivePredictions(getDb(), coupleId, from);
}

export function addPrediction(
  coupleId: string,
  data: Omit<CashbookPrediction, 'id' | 'coupleId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  return _addPrediction(getDb(), coupleId, data);
}

export function updatePrediction(
  coupleId: string,
  predictionId: string,
  data: Parameters<typeof _updatePrediction>[3]
): Promise<void> {
  return _updatePrediction(getDb(), coupleId, predictionId, data);
}

export function deletePrediction(coupleId: string, predictionId: string): Promise<void> {
  return _deletePrediction(getDb(), coupleId, predictionId);
}

export function getPredictionByRecurrenceKey(
  coupleId: string,
  recurrenceKey: string
): Promise<CashbookPrediction | null> {
  return _getPredictionByRecurrenceKey(getDb(), coupleId, recurrenceKey);
}

/**
 * ✓ 예측 확정(SYNC-03 / 시나리오 A·E).
 * 한 트랜잭션(writeBatch)으로:
 *   1) cashbookEntries에 정식 거래 1건 생성 (date는 예측 발생 예정일 기준 — 회고 확정도 그날짜로 등록).
 *   2) 예측 doc을 status='confirmed' + linkedEntryId로 갱신. override가 있으면 캘린더 표시값도 갱신.
 * 같은 거래가 양쪽에 동시에 잡혀 잔액이 이중 계산되지 않도록, 캘린더는 'predicted'만 합산한다.
 * @returns 생성된 cashbookEntry id
 */
export async function confirmPrediction(
  coupleId: string,
  prediction: CashbookPrediction,
  override?: ConfirmOverride
): Promise<string> {
  const db: Firestore = getDb();
  const batch = writeBatch(db);
  const now = Timestamp.now();

  const type = override?.type ?? prediction.type;
  const amount = override?.amount ?? prediction.amount;
  const category = override?.category ?? prediction.category;
  const description = override?.description ?? prediction.description;
  const date = override?.date ?? prediction.date;

  const entryRef = doc(collection(db, `couples/${coupleId}/cashbookEntries`));
  batch.set(entryRef, {
    coupleId,
    createdBy: prediction.createdBy,
    type,
    amount,
    category,
    description,
    date,
    createdAt: now,
  });

  const predRef = doc(db, `couples/${coupleId}/cashbookPredictions/${prediction.id}`);
  batch.update(predRef, {
    status: 'confirmed',
    linkedEntryId: entryRef.id,
    // 시나리오 E: 수정값을 캘린더 항목에도 반영
    type,
    amount,
    category,
    description,
    date,
    updatedAt: now,
  });

  await batch.commit();
  return entryRef.id;
}

/**
 * ✗ 예측 거절(SYNC-04 / 시나리오 B).
 * status='rejected' + rejectedUntil = now + 30d. doc은 삭제하지 않는다:
 *   - 가계부 점선박스/캘린더 잔액은 'predicted'만 보므로 자동으로 빠진다.
 *   - 자동감지(§7-1)는 recurrenceKey로 이 doc을 찾아 30일간 재제안을 건너뛴다.
 * (calendar 출처는 캘린더에 'rejected'로 잔존 표시, auto 출처는 캘린더 표시에서 필터 — 표시 분기는 화면 계층에서.)
 */
export async function rejectPrediction(coupleId: string, predictionId: string): Promise<void> {
  const rejectedUntil = Timestamp.fromDate(
    new Date(Date.now() + REJECT_SUPPRESSION_DAYS * 24 * 60 * 60 * 1000)
  );
  return _updatePrediction(getDb(), coupleId, predictionId, {
    status: 'rejected',
    rejectedUntil,
  });
}

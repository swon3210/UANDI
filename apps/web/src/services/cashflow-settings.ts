import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import type { CashflowSettings } from '@/types';

// 현금흐름 캘린더 설정 — 커플 공동 (couples/{coupleId}/meta/cashflow 단일 문서)
function cashflowSettingsDoc(coupleId: string) {
  return doc(getDb(), `couples/${coupleId}/meta/cashflow`);
}

export async function getCashflowSettings(coupleId: string): Promise<CashflowSettings | null> {
  const snap = await getDoc(cashflowSettingsDoc(coupleId));
  if (!snap.exists()) return null;
  const data = snap.data() as CashflowSettings & { currentCash?: number };

  // 레거시 마이그레이션: initialCash가 없고 currentCash(오늘 기준 현금)만 있던 문서는
  // 그 값을 '최초 현금'으로 승계하고, 기준일은 마지막 설정 시점(updatedAt, 없으면 오늘)으로 본다.
  if (data.initialCash == null && data.currentCash != null) {
    return {
      ...data,
      initialCash: data.currentCash,
      initialDate: data.updatedAt ?? Timestamp.now(),
    };
  }
  return data;
}

// paydays/variableMode는 Phase 2에서 수동 입력 UI가 폐지돼 입력으로 받지 않는다
// (미전달 시 setDoc merge로 기존 값 보존).
export type CashflowSettingsInput = {
  initialCash: number;
  initialDate: Date;
};

export async function updateCashflowSettings(
  coupleId: string,
  data: CashflowSettingsInput
): Promise<void> {
  await setDoc(
    cashflowSettingsDoc(coupleId),
    {
      coupleId,
      initialCash: data.initialCash,
      initialDate: Timestamp.fromDate(data.initialDate),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

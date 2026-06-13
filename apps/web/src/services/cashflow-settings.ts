import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import type { CashflowSettings } from '@/types';

// 현금흐름 캘린더 설정 — 커플 공동 (couples/{coupleId}/meta/cashflow 단일 문서)
function cashflowSettingsDoc(coupleId: string) {
  return doc(getDb(), `couples/${coupleId}/meta/cashflow`);
}

export async function getCashflowSettings(coupleId: string): Promise<CashflowSettings | null> {
  const snap = await getDoc(cashflowSettingsDoc(coupleId));
  if (!snap.exists()) return null;
  return snap.data() as CashflowSettings;
}

// paydays는 Phase 2에서 수동 입력 UI가 폐지돼 선택적이다(미전달 시 setDoc merge로 기존 값 보존).
export type CashflowSettingsInput = Pick<CashflowSettings, 'currentCash' | 'variableMode'> &
  Partial<Pick<CashflowSettings, 'paydays'>>;

export async function updateCashflowSettings(
  coupleId: string,
  data: CashflowSettingsInput
): Promise<void> {
  await setDoc(
    cashflowSettingsDoc(coupleId),
    {
      ...data,
      coupleId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

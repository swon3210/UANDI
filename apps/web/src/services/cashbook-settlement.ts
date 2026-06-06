import { doc, getDoc, setDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import type {
  CashbookSettlement,
  SettlementAttachment,
  SettlementReportSnapshot,
} from '@/types';

/** year/month(1-indexed) → 'YYYY-MM' 문서 키 */
export function monthKeyOf(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function settlementRef(coupleId: string, monthKey: string) {
  return doc(getDb(), `couples/${coupleId}/cashbookSettlements/${monthKey}`);
}

export async function getSettlement(
  coupleId: string,
  monthKey: string
): Promise<CashbookSettlement | null> {
  const snap = await getDoc(settlementRef(coupleId, monthKey));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as CashbookSettlement;
}

/** draft 문서를 보장(없으면 생성)하고 반환한다. */
export async function ensureDraft(
  coupleId: string,
  year: number,
  month: number
): Promise<CashbookSettlement> {
  const monthKey = monthKeyOf(year, month);
  const ref = settlementRef(coupleId, monthKey);
  const snap = await getDoc(ref);
  if (snap.exists()) return { id: snap.id, ...snap.data() } as CashbookSettlement;

  const now = Timestamp.now();
  const draft: Omit<CashbookSettlement, 'id'> = {
    coupleId,
    year,
    month,
    status: 'draft',
    attachments: [],
    report: null,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };
  await setDoc(ref, draft);
  return { id: monthKey, ...draft };
}

/** draft 문서에 첨부를 추가한다(없으면 draft 생성 후 추가). */
export async function addAttachment(
  coupleId: string,
  year: number,
  month: number,
  attachment: SettlementAttachment
): Promise<void> {
  const monthKey = monthKeyOf(year, month);
  await ensureDraft(coupleId, year, month);
  await updateDoc(settlementRef(coupleId, monthKey), {
    attachments: arrayUnion(attachment),
    updatedAt: Timestamp.now(),
  });
}

/** id로 첨부를 제거한다(read-modify-write — Timestamp 동등성 이슈 회피). */
export async function removeAttachment(
  coupleId: string,
  monthKey: string,
  attachmentId: string
): Promise<void> {
  const ref = settlementRef(coupleId, monthKey);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as Omit<CashbookSettlement, 'id'>;
  const next = (data.attachments ?? []).filter((a) => a.id !== attachmentId);
  await updateDoc(ref, { attachments: next, updatedAt: Timestamp.now() });
}

/** 결산 완료 — 보고서 스냅샷 박제 + 첨부 비움 + status=completed. */
export async function completeSettlement(
  coupleId: string,
  year: number,
  month: number,
  report: Omit<SettlementReportSnapshot, 'completedAt'>
): Promise<void> {
  const monthKey = monthKeyOf(year, month);
  await ensureDraft(coupleId, year, month);
  const completedAt = Timestamp.now();
  await updateDoc(settlementRef(coupleId, monthKey), {
    status: 'completed',
    report: { ...report, completedAt },
    attachments: [],
    completedAt,
    updatedAt: completedAt,
  });
}

/** 다시 결산하기 — completed → draft로 되돌리고 보고서를 비운다. */
export async function redoSettlement(coupleId: string, monthKey: string): Promise<void> {
  await updateDoc(settlementRef(coupleId, monthKey), {
    status: 'draft',
    report: null,
    completedAt: null,
    updatedAt: Timestamp.now(),
  });
}

import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import type { AnnualPlan, AnnualPlanItem, AnnualPlanRevision, CashbookCategory } from '@/types';

function plansCol(coupleId: string) {
  return collection(getDb(), `couples/${coupleId}/annualPlans`);
}

function itemsCol(coupleId: string, planId: string) {
  return collection(getDb(), `couples/${coupleId}/annualPlans/${planId}/items`);
}

function revisionsCol(coupleId: string, planId: string) {
  return collection(getDb(), `couples/${coupleId}/annualPlans/${planId}/revisions`);
}

// ── AnnualPlan CRUD ──

export async function getAnnualPlan(coupleId: string, year: number): Promise<AnnualPlan | null> {
  const q = query(plansCol(coupleId), where('year', '==', year));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as AnnualPlan;
}

export async function createAnnualPlan(
  coupleId: string,
  year: number,
  createdBy: string
): Promise<string> {
  const planId = `plan-${year}`;
  const ref = doc(plansCol(coupleId), planId);
  await setDoc(ref, {
    id: planId,
    coupleId,
    year,
    createdBy,
    updatedAt: Timestamp.now(),
    createdAt: Timestamp.now(),
  });
  return planId;
}

// ── AnnualPlanItem helpers ──

export function spreadAnnualEvenly(annual: number): {
  monthlyAmounts: number[];
  baseMonthlyAmount: number;
  annualAmount: number;
} {
  const safe = Math.max(0, Math.round(annual));
  const base = Math.floor(safe / 12);
  const remainder = safe - base * 12;
  const monthly = Array(12).fill(base);
  if (remainder !== 0) monthly[11] = base + remainder;
  return { monthlyAmounts: monthly, baseMonthlyAmount: base, annualAmount: safe };
}

// ── AnnualPlanItem CRUD ──

export async function getPlanItems(coupleId: string, planId: string): Promise<AnnualPlanItem[]> {
  const snap = await getDocs(itemsCol(coupleId, planId));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AnnualPlanItem);
}

export async function upsertPlanItem(
  coupleId: string,
  planId: string,
  itemId: string,
  data: Omit<AnnualPlanItem, 'id'>
): Promise<void> {
  const ref = doc(itemsCol(coupleId, planId), itemId);
  await setDoc(ref, { id: itemId, ...data, updatedAt: Timestamp.now() }, { merge: true });
}

export async function updatePlanItemAmount(
  coupleId: string,
  planId: string,
  itemId: string,
  data: {
    monthlyAmounts?: number[];
    inputMode?: 'regular' | 'irregular';
    baseMonthlyAmount?: number | null;
    annualAmount?: number;
  }
): Promise<void> {
  const ref = doc(itemsCol(coupleId, planId), itemId);
  const patch: Record<string, unknown> = { ...data, updatedAt: Timestamp.now() };
  if (data.monthlyAmounts && data.annualAmount === undefined) {
    patch.annualAmount = data.monthlyAmounts.reduce((s, v) => s + v, 0);
  }
  await updateDoc(ref, patch);
}

export async function deletePlanItem(
  coupleId: string,
  planId: string,
  itemId: string
): Promise<void> {
  const ref = doc(itemsCol(coupleId, planId), itemId);
  await deleteDoc(ref);
}

export async function bulkUpdatePlanItems(
  coupleId: string,
  planId: string,
  updates: { itemId: string; monthlyAmounts: number[] }[]
): Promise<void> {
  const batch = writeBatch(getDb());
  for (const { itemId, monthlyAmounts } of updates) {
    const ref = doc(itemsCol(coupleId, planId), itemId);
    const annualAmount = monthlyAmounts.reduce((s, v) => s + v, 0);
    batch.update(ref, {
      monthlyAmounts,
      annualAmount,
      updatedAt: Timestamp.now(),
    });
  }
  await batch.commit();
}

/**
 * 모든 카테고리에 대해 plan item 이 존재하도록 보장한다.
 * - 카테고리는 있는데 item 이 없으면 0으로 채운 item 생성
 * - item 이 있지만 monthlyAmounts 가 깨졌으면(길이≠12) 0으로 치유
 * 변경이 있었으면 true 를 반환한다(호출부에서 쿼리 무효화 판단용).
 */
export async function ensurePlanItems(
  coupleId: string,
  planId: string,
  categories: CashbookCategory[],
  items: AnnualPlanItem[]
): Promise<boolean> {
  const categoriesById = new Map(categories.map((c) => [c.id, c]));
  const existing = new Set(items.map((i) => i.categoryId));
  const missing = categories.filter((c) => !existing.has(c.id));
  const broken = items.filter(
    (it) =>
      categoriesById.has(it.categoryId) &&
      (!Array.isArray(it.monthlyAmounts) || it.monthlyAmounts.length !== 12)
  );
  if (missing.length === 0 && broken.length === 0) return false;

  await Promise.all([
    ...missing.map((cat) =>
      upsertPlanItem(coupleId, planId, `item-${planId}-${cat.id}`, {
        planId,
        coupleId,
        categoryId: cat.id,
        group: cat.group,
        subGroup: cat.subGroup,
        monthlyAmounts: Array(12).fill(0),
        inputMode: 'irregular',
        baseMonthlyAmount: null,
        annualAmount: 0,
        ownerUid: null,
        updatedAt: Timestamp.now(),
      })
    ),
    ...broken.map((it) => {
      const cat = categoriesById.get(it.categoryId)!;
      return upsertPlanItem(coupleId, planId, it.id, {
        planId,
        coupleId,
        categoryId: it.categoryId,
        group: it.group ?? cat.group,
        subGroup: it.subGroup ?? cat.subGroup,
        monthlyAmounts: Array(12).fill(0),
        inputMode: it.inputMode ?? 'irregular',
        baseMonthlyAmount: typeof it.baseMonthlyAmount === 'number' ? it.baseMonthlyAmount : null,
        annualAmount: 0,
        ownerUid: it.ownerUid ?? null,
        updatedAt: Timestamp.now(),
      });
    }),
  ]);
  return true;
}

// ── AnnualPlanRevision CRUD ──

export async function getPlanRevisions(
  coupleId: string,
  planId: string
): Promise<AnnualPlanRevision[]> {
  const snap = await getDocs(revisionsCol(coupleId, planId));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as AnnualPlanRevision)
    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
}

export async function createPlanRevision(
  coupleId: string,
  planId: string,
  data: Omit<AnnualPlanRevision, 'id' | 'createdAt'>
): Promise<string> {
  const revId = `rev-${Date.now()}`;
  const ref = doc(revisionsCol(coupleId, planId), revId);
  await setDoc(ref, {
    id: revId,
    ...data,
    createdAt: Timestamp.now(),
  });
  return revId;
}

// ── Validation ──

export type AnnualPlanTotals = {
  income: number;
  expense: number;
  flex: number;
};

export function totalsFromItems(items: AnnualPlanItem[]): AnnualPlanTotals {
  const totals: AnnualPlanTotals = { income: 0, expense: 0, flex: 0 };
  for (const it of items) {
    if (it.group in totals) {
      totals[it.group as keyof AnnualPlanTotals] += it.annualAmount;
    }
  }
  return totals;
}

/** 한 달의 수입/지출/Flex 합계와 잉여(수입 - 지출 - Flex). */
export type MonthlyFlow = {
  income: number;
  expense: number;
  flex: number;
  /** 수입 - 지출 - Flex. 음수면 그 달은 적자. */
  surplus: number;
};

/** 모든 항목의 monthlyAmounts 를 더해 12개월 캐시플로우를 만든다. */
export function monthlyFlowsFromItems(items: AnnualPlanItem[]): MonthlyFlow[] {
  const flows: MonthlyFlow[] = Array.from({ length: 12 }, () => ({
    income: 0,
    expense: 0,
    flex: 0,
    surplus: 0,
  }));
  for (const it of items) {
    if (it.group !== 'income' && it.group !== 'expense' && it.group !== 'flex') continue;
    const amounts = Array.isArray(it.monthlyAmounts) ? it.monthlyAmounts : [];
    for (let m = 0; m < 12; m += 1) {
      flows[m][it.group] += amounts[m] ?? 0;
    }
  }
  for (const f of flows) f.surplus = f.income - f.expense - f.flex;
  return flows;
}

export type AnnualPlanValidation = {
  ok: boolean;
  /** 연간 부족액. 음수이거나 0이면 연간 기준 통과. */
  deficit: number;
  totals: AnnualPlanTotals;
  /** 12개월 캐시플로우. */
  monthly: MonthlyFlow[];
  /** 들어오는 돈보다 나가는 돈이 많은 달의 인덱스(0=1월). */
  deficitMonths: number[];
};

export function validateAnnualPlan(items: AnnualPlanItem[]): AnnualPlanValidation {
  const totals = totalsFromItems(items);
  const deficit = totals.expense + totals.flex - totals.income;
  const monthly = monthlyFlowsFromItems(items);
  const deficitMonths = monthly.reduce<number[]>((acc, f, i) => {
    if (f.surplus < 0) acc.push(i);
    return acc;
  }, []);
  // 연간 합계도 흑자여야 하고, 매달 들어오는 돈이 나가는 돈을 감당해야 통과.
  const ok = deficit <= 0 && deficitMonths.length === 0;
  return { ok, deficit, totals, monthly, deficitMonths };
}

// ── Previous Year Data ──

export async function getPreviousYearPlan(
  coupleId: string,
  year: number
): Promise<{ plan: AnnualPlan; items: AnnualPlanItem[] } | null> {
  const plan = await getAnnualPlan(coupleId, year - 1);
  if (!plan) return null;
  const items = await getPlanItems(coupleId, plan.id);
  return { plan, items };
}

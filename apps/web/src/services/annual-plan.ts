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
import type { AnnualPlan, AnnualPlanItem, AnnualPlanRevision } from '@/types';

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

export async function getAnnualPlan(
  coupleId: string,
  year: number
): Promise<AnnualPlan | null> {
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

// ── AnnualPlanItem CRUD ──

export async function getPlanItems(
  coupleId: string,
  planId: string
): Promise<AnnualPlanItem[]> {
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

export type AnnualPlanValidation = {
  ok: boolean;
  /** 부족액. 음수이거나 0이면 ok. */
  deficit: number;
  totals: AnnualPlanTotals;
};

export function validateAnnualPlan(items: AnnualPlanItem[]): AnnualPlanValidation {
  const totals = totalsFromItems(items);
  const deficit = totals.expense + totals.flex - totals.income;
  return { ok: deficit <= 0, deficit, totals };
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

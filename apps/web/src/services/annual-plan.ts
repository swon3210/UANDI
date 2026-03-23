import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import type { AnnualPlan, AnnualPlanItem, InvestmentPlan } from '@/types';

function plansCol(coupleId: string) {
  return collection(getDb(), `couples/${coupleId}/annualPlans`);
}

function itemsCol(coupleId: string, planId: string) {
  return collection(getDb(), `couples/${coupleId}/annualPlans/${planId}/items`);
}

function investmentPlanDoc(coupleId: string, planId: string) {
  return doc(getDb(), `couples/${coupleId}/annualPlans/${planId}/investmentPlan/main`);
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
    annualAmount?: number;
    monthlyAmount?: number | null;
    targetMonths?: number[] | null;
  }
): Promise<void> {
  const ref = doc(itemsCol(coupleId, planId), itemId);
  await updateDoc(ref, { ...data, updatedAt: Timestamp.now() });
}

export async function deletePlanItem(
  coupleId: string,
  planId: string,
  itemId: string
): Promise<void> {
  const ref = doc(itemsCol(coupleId, planId), itemId);
  await deleteDoc(ref);
}

// ── InvestmentPlan CRUD ──

export async function getInvestmentPlan(
  coupleId: string,
  planId: string
): Promise<InvestmentPlan | null> {
  const snap = await getDoc(investmentPlanDoc(coupleId, planId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as InvestmentPlan;
}

export async function upsertInvestmentPlan(
  coupleId: string,
  planId: string,
  data: Omit<InvestmentPlan, 'id'>
): Promise<void> {
  await setDoc(
    investmentPlanDoc(coupleId, planId),
    {
      id: 'main',
      ...data,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
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

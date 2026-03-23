import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAnnualPlan,
  createAnnualPlan,
  getPlanItems,
  upsertPlanItem,
  updatePlanItemAmount,
  deletePlanItem,
  getInvestmentPlan,
  upsertInvestmentPlan,
  getPreviousYearPlan,
} from '@/services/annual-plan';
import type { AnnualPlanItem, InvestmentPlan, CategoryGroup } from '@/types';

const PLAN_KEY = 'annualPlan';
const ITEMS_KEY = 'annualPlanItems';
const INVESTMENT_KEY = 'investmentPlan';
const PREV_YEAR_KEY = 'previousYearPlan';

// ── Queries ──

export function useAnnualPlan(coupleId: string | null, year: number) {
  return useQuery({
    queryKey: [PLAN_KEY, coupleId, year],
    queryFn: () => getAnnualPlan(coupleId!, year),
    enabled: !!coupleId,
  });
}

export function useAnnualPlanItems(coupleId: string | null, planId: string | null) {
  return useQuery({
    queryKey: [ITEMS_KEY, coupleId, planId],
    queryFn: () => getPlanItems(coupleId!, planId!),
    enabled: !!coupleId && !!planId,
  });
}

export function useInvestmentPlan(coupleId: string | null, planId: string | null) {
  return useQuery({
    queryKey: [INVESTMENT_KEY, coupleId, planId],
    queryFn: () => getInvestmentPlan(coupleId!, planId!),
    enabled: !!coupleId && !!planId,
  });
}

export function usePreviousYearPlan(coupleId: string | null, year: number) {
  return useQuery({
    queryKey: [PREV_YEAR_KEY, coupleId, year],
    queryFn: () => getPreviousYearPlan(coupleId!, year),
    enabled: !!coupleId,
  });
}

// ── Mutations ──

export function useCreateAnnualPlan(coupleId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ year, createdBy }: { year: number; createdBy: string }) =>
      createAnnualPlan(coupleId!, year, createdBy),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: [PLAN_KEY, coupleId, variables.year] }),
    onError: () => toast.error('연간 계획 생성에 실패했어요.'),
  });
}

export function useUpsertPlanItem(coupleId: string | null, planId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: Omit<AnnualPlanItem, 'id'> }) =>
      upsertPlanItem(coupleId!, planId!, itemId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ITEMS_KEY, coupleId, planId] }),
    onError: () => toast.error('항목 저장에 실패했어요.'),
  });
}

export function useUpdatePlanItemAmount(coupleId: string | null, planId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: string;
      data: {
        annualAmount?: number;
        monthlyAmount?: number | null;
        targetMonths?: number[] | null;
      };
    }) => updatePlanItemAmount(coupleId!, planId!, itemId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ITEMS_KEY, coupleId, planId] }),
    onError: () => toast.error('금액 수정에 실패했어요.'),
  });
}

export function useDeletePlanItem(coupleId: string | null, planId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => deletePlanItem(coupleId!, planId!, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ITEMS_KEY, coupleId, planId] }),
    onError: () => toast.error('항목 삭제에 실패했어요.'),
  });
}

export function useUpsertInvestmentPlan(coupleId: string | null, planId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<InvestmentPlan, 'id'>) =>
      upsertInvestmentPlan(coupleId!, planId!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [INVESTMENT_KEY, coupleId, planId] }),
    onError: () => toast.error('재테크 계획 저장에 실패했어요.'),
  });
}

// ── Derived Data ──

export type AnnualSummary = {
  totalIncome: number;
  totalExpense: number;
  availableForInvestment: number;
  investmentAllocated: number;
  unallocated: number;
  flexTotal: number;
};

export function useAnnualSummary(items: AnnualPlanItem[] | undefined): AnnualSummary {
  return useMemo(() => {
    if (!items || items.length === 0) {
      return {
        totalIncome: 0,
        totalExpense: 0,
        availableForInvestment: 0,
        investmentAllocated: 0,
        unallocated: 0,
        flexTotal: 0,
      };
    }

    let totalIncome = 0;
    let totalExpense = 0;
    let investmentAllocated = 0;
    let flexTotal = 0;

    for (const item of items) {
      switch (item.group) {
        case 'income':
          totalIncome += item.annualAmount;
          break;
        case 'expense':
          totalExpense += item.annualAmount;
          break;
        case 'investment':
          investmentAllocated += item.annualAmount;
          break;
        case 'flex':
          flexTotal += item.annualAmount;
          break;
      }
    }

    const availableForInvestment = totalIncome - totalExpense;
    const unallocated = availableForInvestment - investmentAllocated - flexTotal;

    return {
      totalIncome,
      totalExpense,
      availableForInvestment,
      investmentAllocated,
      unallocated,
      flexTotal,
    };
  }, [items]);
}

export function filterItemsByGroup(
  items: AnnualPlanItem[] | undefined,
  group: CategoryGroup
): AnnualPlanItem[] {
  if (!items) return [];
  return items.filter((item) => item.group === group);
}

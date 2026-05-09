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
  bulkUpdatePlanItems,
  getPlanRevisions,
  createPlanRevision,
  getPreviousYearPlan,
  validateAnnualPlan,
  totalsFromItems,
  type AnnualPlanTotals,
  type AnnualPlanValidation,
} from '@/services/annual-plan';
import type { AnnualPlanItem, AnnualPlanRevision, CategoryGroup } from '@/types';

const PLAN_KEY = 'annualPlan';
const ITEMS_KEY = 'annualPlanItems';
const REVISIONS_KEY = 'annualPlanRevisions';
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

export function usePreviousYearPlan(coupleId: string | null, year: number) {
  return useQuery({
    queryKey: [PREV_YEAR_KEY, coupleId, year],
    queryFn: () => getPreviousYearPlan(coupleId!, year),
    enabled: !!coupleId,
  });
}

export function useAnnualPlanRevisions(
  coupleId: string | null,
  planId: string | null
) {
  return useQuery({
    queryKey: [REVISIONS_KEY, coupleId, planId],
    queryFn: () => getPlanRevisions(coupleId!, planId!),
    enabled: !!coupleId && !!planId,
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
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: string;
      data: Omit<AnnualPlanItem, 'id'>;
    }) => upsertPlanItem(coupleId!, planId!, itemId, data),
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
        monthlyAmounts?: number[];
        inputMode?: 'regular' | 'irregular';
        baseMonthlyAmount?: number | null;
        annualAmount?: number;
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

export function useBulkUpdatePlanItems(
  coupleId: string | null,
  planId: string | null
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      updates,
      revision,
    }: {
      updates: { itemId: string; monthlyAmounts: number[] }[];
      revision?: Omit<AnnualPlanRevision, 'id' | 'createdAt'>;
    }) => {
      await bulkUpdatePlanItems(coupleId!, planId!, updates);
      if (revision) {
        await createPlanRevision(coupleId!, planId!, revision);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ITEMS_KEY, coupleId, planId] });
      qc.invalidateQueries({ queryKey: [REVISIONS_KEY, coupleId, planId] });
    },
    onError: () => toast.error('일괄 수정 저장에 실패했어요.'),
  });
}

// ── Derived Data ──

export type AnnualSummary = AnnualPlanTotals & {
  surplus: number;
};

export function useAnnualSummary(items: AnnualPlanItem[] | undefined): AnnualSummary {
  return useMemo(() => {
    if (!items || items.length === 0) {
      return { income: 0, expense: 0, flex: 0, surplus: 0 };
    }
    const totals = totalsFromItems(items);
    return { ...totals, surplus: totals.income - totals.expense - totals.flex };
  }, [items]);
}

export function useValidateAnnualPlan(
  items: AnnualPlanItem[] | undefined
): AnnualPlanValidation {
  return useMemo(() => {
    if (!items || items.length === 0) {
      return { ok: true, deficit: 0, totals: { income: 0, expense: 0, flex: 0 } };
    }
    return validateAnnualPlan(items);
  }, [items]);
}

export function filterItemsByGroup(
  items: AnnualPlanItem[] | undefined,
  group: CategoryGroup
): AnnualPlanItem[] {
  if (!items) return [];
  return items.filter((item) => item.group === group);
}

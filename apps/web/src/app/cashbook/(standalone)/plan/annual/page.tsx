'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import dayjs from 'dayjs';
import { ChevronLeft } from 'lucide-react';
import { Header, Button, FullScreenSpinner } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import {
  useAnnualPlan,
  useAnnualPlanItems,
  useInvestmentPlan,
  usePreviousYearPlan,
  useCreateAnnualPlan,
  useUpdatePlanItemAmount,
  useUpsertInvestmentPlan,
  useAnnualSummary,
  filterItemsByGroup,
} from '@/hooks/useAnnualPlan';
import { GoalsMainView } from '@/components/cashbook/GoalsMainView';
import { GoalDetailHeader } from '@/components/cashbook/GoalDetailHeader';
import { IncomePlanTab } from '@/components/cashbook/IncomePlanTab';
import { ExpensePlanTab } from '@/components/cashbook/ExpensePlanTab';
import { InvestmentPlanTab } from '@/components/cashbook/InvestmentPlanTab';
import { FlexPlanTab } from '@/components/cashbook/FlexPlanTab';
import { BottomNav } from '@/components/BottomNav';
import {
  GOAL_CATEGORIES,
  GOAL_CATEGORY_BY_KEY,
  type GoalCategoryKey,
} from '@/constants/goal-categories';
import { upsertPlanItem } from '@/services/annual-plan';
import { Timestamp } from 'firebase/firestore';

const VALID_KEYS: GoalCategoryKey[] = GOAL_CATEGORIES.map((c) => c.key);

function isGoalCategoryKey(value: string | null): value is GoalCategoryKey {
  return value !== null && (VALID_KEYS as string[]).includes(value);
}

export default function AnnualPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const activeCategory: GoalCategoryKey | null = isGoalCategoryKey(categoryParam)
    ? categoryParam
    : null;

  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const uid = user?.uid ?? '';
  const year = dayjs().year();

  const { data: plan, isPending: planPending } = useAnnualPlan(coupleId, year);
  const { data: categories, isPending: catPending } = useCashbookCategories(coupleId);
  const { data: items, isPending: itemsPending } = useAnnualPlanItems(
    coupleId,
    plan?.id ?? null
  );
  const { data: investmentPlan } = useInvestmentPlan(coupleId, plan?.id ?? null);
  const { data: prevYearData } = usePreviousYearPlan(coupleId, year);

  const qc = useQueryClient();
  const createPlanMutation = useCreateAnnualPlan(coupleId);
  const updateAmountMutation = useUpdatePlanItemAmount(coupleId, plan?.id ?? null);
  const upsertInvestmentMutation = useUpsertInvestmentPlan(coupleId, plan?.id ?? null);

  const isLoading = planPending || catPending;

  const planCreatedRef = useRef(false);
  useEffect(() => {
    if (!planPending && !plan && coupleId && !planCreatedRef.current) {
      planCreatedRef.current = true;
      createPlanMutation.mutate({ year, createdBy: uid });
    }
  }, [planPending, plan, coupleId, year, uid, createPlanMutation]);

  const itemsInitRef = useRef(false);
  useEffect(() => {
    if (!plan || !categories || !items || itemsPending) return;
    if (itemsInitRef.current) return;

    const existingCategoryIds = new Set(items.map((i) => i.categoryId));
    const missingCategories = categories.filter(
      (c) => !existingCategoryIds.has(c.id)
    );

    if (missingCategories.length === 0) return;
    itemsInitRef.current = true;

    Promise.all(
      missingCategories.map((cat) => {
        const itemId = `item-${plan.id}-${cat.id}`;
        return upsertPlanItem(coupleId!, plan.id, itemId, {
          planId: plan.id,
          coupleId: coupleId!,
          categoryId: cat.id,
          group: cat.group,
          subGroup: cat.subGroup,
          annualAmount: 0,
          monthlyAmount: null,
          targetMonths: null,
          ownerUid: null,
          updatedAt: Timestamp.now(),
        });
      })
    ).then(() => {
      qc.invalidateQueries({ queryKey: ['annualPlanItems', coupleId, plan.id] });
    });
  }, [plan, categories, items, itemsPending, coupleId, qc]);

  const summary = useAnnualSummary(items);

  const handleItemAmountChange = useCallback(
    (itemId: string, annualAmount: number, monthlyAmount: number | null) => {
      updateAmountMutation.mutate({
        itemId,
        data: { annualAmount, monthlyAmount },
      });
    },
    [updateAmountMutation]
  );

  const handleTargetMonthsChange = useCallback(
    (itemId: string, months: number[]) => {
      updateAmountMutation.mutate({
        itemId,
        data: { targetMonths: months },
      });
    },
    [updateAmountMutation]
  );

  const handleApplySuggestion = useCallback(
    (itemId: string, amount: number) => {
      updateAmountMutation.mutate({
        itemId,
        data: { annualAmount: amount },
      });
    },
    [updateAmountMutation]
  );

  const handleTargetReturnRateChange = useCallback(
    (rate: number) => {
      if (!plan) return;
      upsertInvestmentMutation.mutate({
        planId: plan.id,
        coupleId: coupleId!,
        targetReturnRate: rate,
        totalAvailable: summary.availableForInvestment,
        targetAmount: Math.round(summary.availableForInvestment * (1 + rate / 100)),
        updatedAt: Timestamp.now(),
      });
    },
    [plan, coupleId, summary.availableForInvestment, upsertInvestmentMutation]
  );

  const flexAvailable =
    summary.availableForInvestment - summary.investmentAllocated;

  const goToCategory = useCallback(
    (key: GoalCategoryKey) => {
      router.push(`/cashbook/plan/annual?category=${key}`);
    },
    [router]
  );

  const goToMain = useCallback(() => {
    router.push('/cashbook/plan/annual');
  }, [router]);

  if (isLoading) return <FullScreenSpinner />;

  const inDetail = activeCategory !== null;
  const detailTheme = activeCategory ? GOAL_CATEGORY_BY_KEY[activeCategory] : null;
  const detailItems = activeCategory
    ? filterItemsByGroup(items, GOAL_CATEGORY_BY_KEY[activeCategory].group)
    : [];
  const detailItemsTotal = detailItems.reduce((s, it) => s + it.annualAmount, 0);

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      {inDetail && detailTheme ? (
        <Header
          data-testid="annual-plan-header"
          title={`${detailTheme.emoji} ${detailTheme.label} 예산`}
          leftSlot={
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-coral-400 hover:text-coral-500"
              onClick={goToMain}
              aria-label="목표 메인으로"
              data-testid="goal-detail-back"
            >
              <ChevronLeft size={18} />
              <span className="text-sm">목표</span>
            </Button>
          }
        />
      ) : (
        <Header data-testid="annual-plan-header" title={`${year}년 경제 목표`} />
      )}

      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-20">
        {!inDetail && items && (
          <GoalsMainView items={items} onSelectCategory={goToCategory} />
        )}

        {inDetail && detailTheme && items && (
          <div className="space-y-6" data-testid="goal-detail-view">
            <GoalDetailHeader theme={detailTheme} itemsTotal={detailItemsTotal} />

            {detailTheme.key === 'income' && (
              <IncomePlanTab
                items={detailItems}
                categories={categories ?? []}
                previousYearItems={
                  prevYearData
                    ? filterItemsByGroup(prevYearData.items, 'income')
                    : undefined
                }
                onItemAmountChange={handleItemAmountChange}
                onApplySuggestion={handleApplySuggestion}
              />
            )}

            {detailTheme.key === 'expense' && (
              <ExpensePlanTab
                items={detailItems}
                categories={categories ?? []}
                currentUserUid={uid}
                onItemAmountChange={handleItemAmountChange}
                onTargetMonthsChange={handleTargetMonthsChange}
              />
            )}

            {detailTheme.key === 'investment' && (
              <InvestmentPlanTab
                key={investmentPlan?.id ?? 'init'}
                items={detailItems}
                categories={categories ?? []}
                totalIncome={summary.totalIncome}
                totalExpense={summary.totalExpense}
                targetReturnRate={investmentPlan?.targetReturnRate ?? 0}
                onTargetReturnRateChange={handleTargetReturnRateChange}
                onItemAmountChange={handleItemAmountChange}
              />
            )}

            {detailTheme.key === 'flex' && (
              <FlexPlanTab
                items={detailItems}
                categories={categories ?? []}
                flexAvailable={flexAvailable}
                currentUserUid={uid}
                onItemAmountChange={handleItemAmountChange}
              />
            )}
          </div>
        )}
      </main>

      <BottomNav activeTab="cashbook" />
    </div>
  );
}

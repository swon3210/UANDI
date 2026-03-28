'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import dayjs from 'dayjs';
import { ChevronLeft } from 'lucide-react';
import {
  Header,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  FullScreenSpinner,
} from '@uandi/ui';
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
import { AnnualSummaryCard } from '@/components/cashbook/AnnualSummaryCard';
import { IncomePlanTab } from '@/components/cashbook/IncomePlanTab';
import { ExpensePlanTab } from '@/components/cashbook/ExpensePlanTab';
import { InvestmentPlanTab } from '@/components/cashbook/InvestmentPlanTab';
import { FlexPlanTab } from '@/components/cashbook/FlexPlanTab';
import { BottomNav } from '@/components/BottomNav';
import { upsertPlanItem } from '@/services/annual-plan';
import { Timestamp } from 'firebase/firestore';

export default function AnnualPlanPage() {
  const router = useRouter();
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

  // 계획이 없으면 자동 생성
  const planCreatedRef = useRef(false);
  useEffect(() => {
    if (!planPending && !plan && coupleId && !planCreatedRef.current) {
      planCreatedRef.current = true;
      createPlanMutation.mutate({ year, createdBy: uid });
    }
  }, [planPending, plan, coupleId, year, uid, createPlanMutation]);

  // 카테고리 기반으로 아이템 초기화 (plan과 categories가 준비되면)
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

    // 서비스를 직접 호출하여 일괄 생성 후 query를 한 번만 무효화
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

  const incomeItems = filterItemsByGroup(items, 'income');
  const expenseItems = filterItemsByGroup(items, 'expense');
  const investmentItems = filterItemsByGroup(items, 'investment');
  const flexItems = filterItemsByGroup(items, 'flex');

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

  if (isLoading) return <FullScreenSpinner />;

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        data-testid="annual-plan-header"
        title={`${year}년 예산 계획`}
        leftSlot={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => router.push('/cashbook')}
            aria-label="뒤로"
          >
            <ChevronLeft size={20} />
          </Button>
        }
      />

      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-20">
        <AnnualSummaryCard
          totalIncome={summary.totalIncome}
          totalExpense={summary.totalExpense}
          investmentAllocated={summary.investmentAllocated}
          flexTotal={summary.flexTotal}
        />

        <Tabs defaultValue="income" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="income">수입</TabsTrigger>
            <TabsTrigger value="expense">지출</TabsTrigger>
            <TabsTrigger value="investment">재테크</TabsTrigger>
            <TabsTrigger value="flex">Flex</TabsTrigger>
          </TabsList>

          <TabsContent value="income" className="mt-4">
            <IncomePlanTab
              items={incomeItems}
              categories={categories ?? []}
              previousYearItems={
                prevYearData
                  ? filterItemsByGroup(prevYearData.items, 'income')
                  : undefined
              }
              onItemAmountChange={handleItemAmountChange}
              onApplySuggestion={handleApplySuggestion}
            />
          </TabsContent>

          <TabsContent value="expense" className="mt-4">
            <ExpensePlanTab
              items={expenseItems}
              categories={categories ?? []}
              currentUserUid={uid}
              onItemAmountChange={handleItemAmountChange}
              onTargetMonthsChange={handleTargetMonthsChange}
            />
          </TabsContent>

          <TabsContent value="investment" className="mt-4">
            <InvestmentPlanTab
              key={investmentPlan?.id ?? 'init'}
              items={investmentItems}
              categories={categories ?? []}
              totalIncome={summary.totalIncome}
              totalExpense={summary.totalExpense}
              targetReturnRate={investmentPlan?.targetReturnRate ?? 0}
              onTargetReturnRateChange={handleTargetReturnRateChange}
              onItemAmountChange={handleItemAmountChange}
            />
          </TabsContent>

          <TabsContent value="flex" className="mt-4">
            <FlexPlanTab
              items={flexItems}
              categories={categories ?? []}
              flexAvailable={flexAvailable}
              currentUserUid={uid}
              onItemAmountChange={handleItemAmountChange}
            />
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav activeTab="cashbook" />
    </div>
  );
}

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import dayjs from 'dayjs';
import { Header, FullScreenSpinner } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import {
  useAnnualPlan,
  useAnnualPlanItems,
  useCreateAnnualPlan,
} from '@/hooks/useAnnualPlan';
import { GoalsMainView } from '@/components/cashbook/GoalsMainView';
import { BottomNav } from '@/components/BottomNav';
import { type GoalCategoryKey } from '@/constants/goal-categories';
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

  const qc = useQueryClient();
  const createPlanMutation = useCreateAnnualPlan(coupleId);

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
          monthlyAmounts: Array(12).fill(0),
          inputMode: 'irregular',
          baseMonthlyAmount: null,
          annualAmount: 0,
          ownerUid: null,
          updatedAt: Timestamp.now(),
        });
      })
    ).then(() => {
      qc.invalidateQueries({ queryKey: ['annualPlanItems', coupleId, plan.id] });
    });
  }, [plan, categories, items, itemsPending, coupleId, qc]);

  const goToCategory = useCallback(
    (_key: GoalCategoryKey) => {
      // 위저드/일괄 수정으로 대체될 예정. PR 3에서 라우팅을 다시 정의한다.
      router.push('/cashbook/plan/annual');
    },
    [router]
  );

  if (isLoading) return <FullScreenSpinner />;

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <Header data-testid="annual-plan-header" title={`${year}년 경제 목표`} />

      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-20">
        {items && <GoalsMainView items={items} onSelectCategory={goToCategory} />}
      </main>

      <BottomNav activeTab="cashbook" />
    </div>
  );
}

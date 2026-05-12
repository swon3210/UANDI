'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import dayjs from 'dayjs';
import { Pencil, RotateCcw } from 'lucide-react';
import { Header, FullScreenSpinner } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import {
  useAnnualPlan,
  useAnnualPlanItems,
  useAnnualPlanRevisions,
} from '@/hooks/useAnnualPlan';
import { GoalsMainView } from '@/components/cashbook/GoalsMainView';
import { BottomNav } from '@/components/BottomNav';
import { type GoalCategoryKey } from '@/constants/goal-categories';

const WIZARD_INTRO = '/cashbook/plan/annual/wizard?step=intro';

export default function AnnualPlanPage() {
  const router = useRouter();

  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const year = dayjs().year();

  const { data: plan, isPending: planPending } = useAnnualPlan(coupleId, year);
  const { isPending: catPending } = useCashbookCategories(coupleId);
  const { data: items, isPending: itemsPending } = useAnnualPlanItems(
    coupleId,
    plan?.id ?? null
  );
  const { data: revisions } = useAnnualPlanRevisions(coupleId, plan?.id ?? null);

  const isLoading = planPending || catPending || (!!plan && itemsPending);
  const canBulkEdit = (revisions?.length ?? 0) >= 1;

  // plan/items 미존재 또는 monthlyAmounts 누락 시 위저드로 redirect
  useEffect(() => {
    if (!coupleId) return;
    if (planPending || catPending) return;
    if (!plan) {
      router.replace(WIZARD_INTRO);
      return;
    }
    if (itemsPending || !items) return;
    if (items.length === 0) {
      router.replace(WIZARD_INTRO);
      return;
    }
    const hasMissing = items.some(
      (it) =>
        !Array.isArray(it.monthlyAmounts) || it.monthlyAmounts.length !== 12
    );
    if (hasMissing) router.replace(WIZARD_INTRO);
  }, [coupleId, plan, planPending, items, itemsPending, catPending, router]);

  const goToCategory = useCallback(
    (key: GoalCategoryKey) => {
      router.push(`/cashbook/plan/annual/items?group=${key}`);
    },
    [router]
  );

  const handleRedo = useCallback(() => {
    router.push(WIZARD_INTRO);
  }, [router]);

  const handleBulkEdit = useCallback(() => {
    router.push('/cashbook/plan/annual/bulk-edit');
  }, [router]);

  if (isLoading) return <FullScreenSpinner />;

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <Header
        data-testid="annual-plan-header"
        title={`${year}년 경제 목표`}
        rightSlot={
          <div className="flex items-center gap-1">
            {canBulkEdit && (
              <button
                type="button"
                onClick={handleBulkEdit}
                aria-label="월별 일괄 수정"
                data-testid="annual-plan-bulk-edit"
                className="flex h-9 w-9 items-center justify-center rounded-full text-stone-600 transition-colors hover:bg-stone-100"
              >
                <Pencil size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={handleRedo}
              aria-label="처음부터 다시 세우기"
              data-testid="annual-plan-redo"
              className="flex h-9 w-9 items-center justify-center rounded-full text-stone-600 transition-colors hover:bg-stone-100"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        }
      />

      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-20">
        {items && <GoalsMainView items={items} onSelectCategory={goToCategory} />}
      </main>

      <BottomNav activeTab="cashbook" />
    </div>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { Suspense, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAtomValue } from 'jotai';
import dayjs from 'dayjs';
import { Pencil, RotateCcw } from 'lucide-react';
import { Header } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import { MascotLoader } from '@/components/MascotLoader';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { useAnnualPlan, useAnnualPlanItems, useAnnualPlanRevisions } from '@/hooks/useAnnualPlan';
import { GoalsMainView } from '@/components/cashbook/GoalsMainView';
import { type GoalCategoryKey } from '@/constants/goal-categories';
import { BackButton } from '@/components/shell/BackButton';
import { HomeButton } from '@/components/shell/HomeButton';
import { WIZARD_ENTRY_PARAM, parseWizardEntry } from '@/lib/plan-wizard-entry';
import { AnnualPlanPromptCard } from '@/components/dashboard/AnnualPlanPromptCard';

const WIZARD_PATH = '/inner/cashbook/plan/annual/wizard';
const WIZARD_INTRO = `${WIZARD_PATH}?step=intro`;

export default function AnnualPlanPage() {
  return (
    <Suspense fallback={<MascotLoader fullScreen />}>
      <AnnualPlanContent />
    </Suspense>
  );
}

function AnnualPlanContent() {
  const t = useTranslations('cashbook.goals');
  const router = useRouter();
  // 대시보드 권유 카드 → 위저드를 거쳐 왔으면 ←가 위저드 단계로 돌아가므로 "홈으로"를 함께 둔다
  const fromOnboarding = parseWizardEntry(useSearchParams().get(WIZARD_ENTRY_PARAM)) !== null;

  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const year = dayjs().year();

  const { data: plan, isPending: planPending } = useAnnualPlan(coupleId, year);
  const { isPending: catPending } = useCashbookCategories(coupleId);
  const { data: items, isPending: itemsPending } = useAnnualPlanItems(coupleId, plan?.id ?? null);
  const { data: revisions } = useAnnualPlanRevisions(coupleId, plan?.id ?? null);

  const isLoading = planPending || catPending || (!!plan && itemsPending);
  const canBulkEdit = (revisions?.length ?? 0) >= 1;
  // 위저드를 끝내지 않은 플랜(리비전 0개) — "예상 연간 잉여"만 덩그러니 보이지 않게 이어서 하기 배너
  const isIncomplete = !!plan && revisions !== undefined && revisions.length === 0;
  const progress = items
    ? {
        done: items.filter((it) => it.monthlyAmounts.some((v) => v > 0)).length,
        total: items.length,
      }
    : undefined;

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
      (it) => !Array.isArray(it.monthlyAmounts) || it.monthlyAmounts.length !== 12
    );
    if (hasMissing) router.replace(WIZARD_INTRO);
  }, [coupleId, plan, planPending, items, itemsPending, catPending, router]);

  const goToCategory = useCallback(
    (key: GoalCategoryKey) => {
      router.push(`/inner/cashbook/plan/annual/items?group=${key}`);
    },
    [router]
  );

  const handleRedo = useCallback(() => {
    router.push(WIZARD_INTRO);
  }, [router]);

  const handleBulkEdit = useCallback(() => {
    router.push('/inner/cashbook/plan/annual/bulk-edit');
  }, [router]);

  if (isLoading) return <MascotLoader fullScreen />;

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <Header
        data-testid="annual-plan-header"
        title={t('pageTitle', { year })}
        leftSlot={<BackButton fallbackHref="/inner/cashbook/settings" />}
        rightSlot={
          <div className="flex items-center gap-1">
            {fromOnboarding && <HomeButton data-testid="annual-plan-home" />}
            {canBulkEdit && (
              <button
                type="button"
                onClick={handleBulkEdit}
                aria-label={t('bulkEdit')}
                data-testid="annual-plan-bulk-edit"
                className="flex h-9 w-9 items-center justify-center rounded-full text-stone-600 transition-colors hover:bg-stone-100"
              >
                <Pencil size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={handleRedo}
              aria-label={t('redo')}
              data-testid="annual-plan-redo"
              className="flex h-9 w-9 items-center justify-center rounded-full text-stone-600 transition-colors hover:bg-stone-100"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        }
      />

      <main className="mx-auto w-full max-w-md flex-1 space-y-4 px-4 pt-4 pb-20">
        {isIncomplete && plan ? (
          <AnnualPlanPromptCard
            year={year}
            variant="resume"
            progress={progress}
            href={`${WIZARD_PATH}${plan.wizardLastStep ?? '?step=intro'}`}
            data-testid="annual-plan-resume"
          />
        ) : null}
        {items && <GoalsMainView items={items} onSelectCategory={goToCategory} />}
      </main>
    </div>
  );
}

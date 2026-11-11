'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Receipt } from 'lucide-react';
import { Button } from '@uandi/ui';
import { PageHeader } from '@/components/shell/PageHeader';
import { NudgeButton } from '@/components/cashbook/NudgeButton';
import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useAuth } from '@/hooks/useAuth';
import { useCoupleMembers } from '@/hooks/useCoupleMembers';
import { useCashbookEntryAutoOpen } from '@/hooks/useCashbookEntryAutoOpen';
import { useHasAnyEntries } from '@/hooks/useHasAnyEntries';
import { useAnnualPlan, useAnnualPlanItems, useAnnualPlanRevisions } from '@/hooks/useAnnualPlan';
import { useSsrSafeLocalStorage } from '@/hooks/useSsrSafeLocalStorage';
import { WIZARD_ENTRY_ONBOARDING, withWizardEntry } from '@/lib/plan-wizard-entry';
import { AnnualPlanPromptCard } from './AnnualPlanPromptCard';
import { BudgetDashboard } from './BudgetDashboard';
import { CoupleStatusSection } from './CoupleStatusSection';
import { NudgeReceivedSection } from './NudgeReceivedSection';

const WIZARD_PATH = '/inner/cashbook/plan/annual/wizard';
const WIZARD_INTRO = `${WIZARD_PATH}?step=intro`;
/** 예산 권유 카드를 닫은 뒤 다시 보이기까지의 기간 */
const PLAN_PROMPT_SNOOZE_MS = 30 * 24 * 60 * 60 * 1000;

export function Dashboard() {
  const t = useTranslations('dashboard');
  const { user } = useAuth();
  const coupleId = user?.coupleId;
  const { data: members } = useCoupleMembers(coupleId ?? null);
  const partnerName = members?.find((m) => m.uid !== user?.uid)?.displayName?.trim() || null;
  const { data: hasEntries } = useHasAnyEntries(coupleId ?? null);
  const year = dayjs().year();
  const { data: plan, isPending: planPending } = useAnnualPlan(coupleId ?? null, year);
  const { data: planItems } = useAnnualPlanItems(coupleId ?? null, plan?.id ?? null);
  const { data: revisions } = useAnnualPlanRevisions(coupleId ?? null, plan?.id ?? null);
  // 값 = 카드가 다시 보여야 하는 시각(ms). 마운트 시각과 비교한다.
  const [promptDismissedAt, setPromptDismissedAt] = useSsrSafeLocalStorage<number | null>(
    `moa:annual-plan-card-dismissed:${year}`,
    null
  );
  const [renderedAtMs] = useState(() => Date.now());

  // 첫 진입 시 온보딩 투어 1회(화면이 그려지고 내역 유무를 안 뒤)
  const tourContext = useMemo(
    () => ({ partnerName, hasEntries: hasEntries ?? null }),
    [partnerName, hasEntries]
  );
  useCashbookEntryAutoOpen(coupleId ?? null, tourContext);

  if (!coupleId) return null;

  // 올해 예산이 없으면 "세우기", 위저드를 끝내지 않았으면(리비전 0개) "이어서 세우기" 카드.
  // 닫으면 30일 뒤 다시. 위저드로 자동 이동하지 않는다.
  // 닫은 시각은 "다시 보일 시각"으로 저장해 두어 렌더 중엔 비교만 한다(렌더 중 Date.now() 호출 회피).
  const promptSnoozed = promptDismissedAt !== null && promptDismissedAt > renderedAtMs;
  const planIncomplete = !!plan && revisions !== undefined && revisions.length === 0;
  const showPlanPrompt = !planPending && (!plan || planIncomplete) && !promptSnoozed;
  const planProgress = planItems
    ? {
        done: planItems.filter((it) => it.monthlyAmounts.some((v) => v > 0)).length,
        total: planItems.length,
      }
    : undefined;

  return (
    <>
      <PageHeader
        title={t('title')}
        data-testid="dashboard-header"
        rightSlot={
          <Button asChild variant="ghost" size="sm" className="gap-1 px-2">
            <Link href="/inner/cashbook/history" data-testid="dashboard-history-link">
              <Receipt size={16} aria-hidden />
              {t('history')}
            </Link>
          </Button>
        }
      />
      <main className="w-full max-w-md mx-auto px-4 pb-20 pt-4 space-y-4">
        <CoupleStatusSection />
        <NudgeReceivedSection />
        {showPlanPrompt ? (
          <AnnualPlanPromptCard
            year={year}
            variant={plan ? 'resume' : 'start'}
            progress={planProgress}
            href={withWizardEntry(
              plan ? `${WIZARD_PATH}${plan.wizardLastStep ?? '?step=intro'}` : WIZARD_INTRO,
              WIZARD_ENTRY_ONBOARDING
            )}
            onDismiss={() => setPromptDismissedAt(Date.now() + PLAN_PROMPT_SNOOZE_MS)}
          />
        ) : null}
        <BudgetDashboard coupleId={coupleId} />
        <NudgeButton />
      </main>
    </>
  );
}
